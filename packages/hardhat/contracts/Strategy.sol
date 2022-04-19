//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Hardhat
import "hardhat/console.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DecimalMath} from "@lyrafinance/core/contracts/synthetix/DecimalMath.sol";
import {SignedDecimalMath} from "@lyrafinance/core/contracts/synthetix/SignedDecimalMath.sol";

// Libraries
import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import './synthetix/SignedSafeDecimalMath.sol';
import './synthetix/SafeDecimalMath.sol';
import './interfaces/IFuturesMarket.sol';

// Vault 
import {Vault} from "./libraries/Vault.sol";
import {OtusVault} from "./OtusVault.sol";
import {VaultAdapter} from "./VaultAdapter.sol";
import {FuturesAdapter} from "./FuturesAdapter.sol";

contract Strategy is VaultAdapter {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  uint public activeExpiry;
  
  uint[] public activeStrikeIds;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public lastTradeTimestamp;

  address public keeper; 
  address public vault;
  address public futuresMarket;

  OtusVault public otusVault;
  GWAVOracle public immutable gwavOracle;
  
  OptionType public optionType;
  IERC20 public collateralAsset;

  uint public currentStrikePrice;

  // strategies can be updated by different strategizers
  struct Detail {
    uint collatBuffer; // multiple of vaultAdapter.minCollateral(): 1.1 -> 110% * minCollat
    uint collatPercent; // partial collateral: 0.9 -> 90% * fullCollat
    uint minTimeToExpiry;
    uint maxTimeToExpiry;
    int targetDelta;
    uint maxDeltaGap;
    uint minVol;
    uint maxVol;
    uint size;
    uint minTradeInterval;
    uint maxVolVariance;
    uint gwavPeriod;
  }

  struct HedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint maxHedgeAttempts; // 
    uint limitStrikePricePercent; // ex. strike price of 3100 2% ~ 3030
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; 
  }

  Detail public currentStrategy;
  HedgeDetail public currentHedgeStrategy;

  /************************************************
   *  EVENTS
   ***********************************************/

  event KeeperUpdated(address keeper);

  event HedgeClosePosition(address closer);

  event HedgeModifyPosition(address closer, uint marginDelta, uint256 hedgeAttempt);


  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ADMIN
   ***********************************************/

  constructor(
    GWAVOracle _gwavOracle,
    address _curveSwap,
    address _optionToken,
    address _optionMarket,
    address _liquidityPool,
    address _shortCollateral,
    address _synthetixAdapter,
    address _optionPricer,
    address _greekCache,
    address _feeCounter
  ) VaultAdapter(
    _curveSwap,
    _optionToken,
    _optionMarket,
    _liquidityPool,
    _shortCollateral,
    _synthetixAdapter,
    _optionPricer,
    _greekCache,
    _feeCounter
  ) {
    gwavOracle = _gwavOracle;
  }

  function initialize(
    address _vault, 
    address _owner, 
    address _quoteAsset, 
    address _baseAsset
  ) external {    
    baseInitialize(
      _owner, 
      _quoteAsset, 
      _baseAsset
    );
    vault = _vault;
    otusVault = OtusVault(_vault); 
    futuresMarket = otusVault.futuresMarket(); // future kwenta adapter --> vaultadapter

    quoteAsset = IERC20(_quoteAsset); 
    baseAsset = IERC20(_baseAsset); 

    quoteAsset.approve(address(vault), type(uint).max);
    baseAsset.approve(address(vault), type(uint).max);
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  * quoteAsset usually USD baseAsset usually ETH
  */
  function setStrategy(
      Detail memory _strategy, 
      HedgeDetail memory _hedgeStrategy,
      uint _tradeOptionType
    ) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    
    currentStrategy = _strategy;
    currentHedgeStrategy = _hedgeStrategy;

    optionType = OptionType(_tradeOptionType); 
    collateralAsset = _isBaseCollat() ? baseAsset : quoteAsset;
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @dev set the board id that will be traded for the next round
   * @param boardId lyra board Id.
   */
  function setBoard(uint boardId) external onlyVault {
    Board memory board = getBoard(boardId);
    require(_isValidExpiry(board.expiry), "invalid board");
    activeExpiry = board.expiry;
  }


  /**
   * @dev convert premium in quote asset into collateral asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint quoteBal = quoteAsset.balanceOf(address(this));

    if (_isBaseCollat()) {
      // exchange quote asset to base asset, and send base asset back to vault
      uint baseBal = baseAsset.balanceOf(address(this));
      uint minQuoteExpected = quoteBal.divideDecimal(exchangeParams.spotPrice).multiplyDecimal(
        DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
      );
      uint baseReceived = exchangeFromExactQuote(quoteBal, minQuoteExpected);
      require(baseAsset.transfer(address(vault), baseBal + baseReceived), "failed to return funds from strategy");
    } else {
      // send quote balance directly
      require(quoteAsset.transfer(address(vault), quoteBal), "failed to return funds from strategy");
    }

    _clearAllActiveStrikes();
  }


    /**
   * @notice sell a fix aomunt of options and collect premium
   * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
   * @param strikeId lyra strikeId to trade
   * @return positionId
   * @return premiumReceived
   */
  function doTrade(uint strikeId)
    external
    onlyVault
    returns (
      uint positionId,
      uint premiumReceived,
      uint collateralToAdd
    )
  {
    // validate trade
    require(
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp,
      "min time interval not passed"
    );
    require(_isValidVolVariance(strikeId), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike), "invalid strike");

    uint setCollateralTo;
    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike);

    require(
      collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
      "collateral transfer from vault failed"
    );

    (positionId, premiumReceived) = _sellStrike(strike, setCollateralTo);
  }
  
  // function calcualteStrategySize(uint currentSize) internal returns (uint strategySize) {
  //   if (vType == VaultType.SHORT_CALL || vType == VaultType.SHORT_PUT) {
  //     strategySize = currentSize; 
  //   }

  //   if (vType == VaultType.APE_BULL) {
  //     strategySize = currentSize.multiplyDecimal(.8); // .2 for collateral
  //   }

  //   if (vType == VaultType.SHORT_STRADDLE) {
  //     strategySize = currentSize.divideDecimalRound(2); // need half collateral for sell put and ssell call
  //   }
  // }
  /**
   * @dev calculate required collateral to add in the next trade.
   * sell size is fixed as currentStrategy.size
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   */
  function getRequiredCollateral(Strike memory strike)
    public
    view
    returns (uint collateralToAdd, uint setCollateralTo)
  {
    uint sellAmount = currentStrategy.size;
    ExchangeRateParams memory exchangeParams = getExchangeParams();

    // get existing position info if active
    uint existingAmount = 0;
    uint existingCollateral = 0;
    if (_isActiveStrike(strike.id)) {
      OptionPosition memory position = getPositions(_toDynamic(strikeToPositionId[strike.id]))[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }

    // gets minBufferCollat for the whole position
    uint minBufferCollateral = _getBufferCollateral(
      strike.strikePrice,
      strike.expiry,
      exchangeParams.spotPrice,
      existingAmount + sellAmount
    );

    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = existingCollateral +
      _getFullCollateral(strike.strikePrice, sellAmount).multiplyDecimal(currentStrategy.collatPercent);

    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;
  }

  /**
   * @dev perform the trade
   * @param strike strike detail
   * @param setCollateralTo target collateral amount
   * @return positionId
   * @return premiumReceived
   */
  function _sellStrike(
    Strike memory strike,
    uint setCollateralTo
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true);
    // perform trade
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 4,
        optionType: optionType,
        amount: currentStrategy.size, // size should be different depending on strategy 
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  /**
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   */
  function reducePosition(
    uint positionId,
    uint closeAmount
  ) external onlyVault {
    OptionPosition memory position = getPositions(_toDynamic(positionId))[0];
    Strike memory strike = getStrikes(_toDynamic(position.strikeId))[0];
    require(strikeToPositionId[position.strikeId] == positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    require(
      closeAmount <= getAllowedCloseAmount(position, strike.strikePrice, strike.expiry),
      "amount exceeds allowed close amount"
    );

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(strike, false);
    TradeInputParameters memory tradeParams = TradeInputParameters({
      strikeId: position.strikeId,
      positionId: position.positionId,
      iterations: 3,
      optionType: optionType,
      amount: closeAmount,
      setCollateralTo: position.collateral,
      minTotalCost: type(uint).min,
      maxTotalCost: maxExpectedPremium,
      rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
    });

    TradeResult memory result;
    if (!_isOutsideDeltaCutoff(strike.id)) {
      result = closePosition(tradeParams);
    } else {
      // will pay less competitive price to close position
      result = forceClosePosition(tradeParams);
    }

    require(result.totalCost <= maxExpectedPremium, "premium paid is above max expected premium");

    // return closed collateral amount
    if (_isBaseCollat()) {
      uint currentBal = baseAsset.balanceOf(address(this));
      baseAsset.transfer(address(vault), currentBal);
    } else {
      // quote collateral
      quoteAsset.transfer(address(vault), closeAmount);
    }
  }

  /**
   * @dev calculates the position amount required to stay above the buffer collateral
   */
  function getAllowedCloseAmount(
    OptionPosition memory position,
    uint strikePrice,
    uint strikeExpiry
  ) public view returns (uint closeAmount) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint minCollatPerAmount = _getBufferCollateral(strikePrice, strikeExpiry, exchangeParams.spotPrice, 1e18);

    closeAmount = position.collateral < minCollatPerAmount.multiplyDecimal(position.amount)
      ? position.amount - position.collateral.divideDecimal(minCollatPerAmount)
      : 0;
  }

  /************************************************
   *  KEEPER ACTIONS - KWENTA HEDGE
   ***********************************************/

  /**
   * @dev this should be executed after the vault execute trade on OptionMarket and by keeper
   */
  function _openKwentaPosition(uint hedgeAttempts) public onlyVault returns (bool activeShort) {
    require(currentHedgeStrategy.maxHedgeAttempts <= hedgeAttempts); 
    require(!activeShort, "Active futures hedge");
    // uint marginDelta; // 1 - (collateral * .85) * leverage required uint "-" is for shorts
    uint marginDelta = calculateHedgePositionSize();
    IFuturesMarket(futuresMarket).modifyPosition(int(marginDelta));
    hedgeAttempts += 1; 
    activeShort = true; 
    emit HedgeModifyPosition(msg.sender, marginDelta, hedgeAttempts);
  }

  /**
  * @dev called by keeper 
  * update vault collateral, call 
  */
  function _closeKwentaPosition() public onlyVault returns (bool activeShort) {
    require(activeShort, "No current position");
    IFuturesMarket(futuresMarket).closePosition();
    activeShort = false; 
    // transfer all funds back to vault state
    emit HedgeClosePosition(msg.sender);
  }

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  */
  function calculateReducePositionPrice() internal view returns (uint strikeLimitPrice) {
    strikeLimitPrice = currentHedgeStrategy.limitStrikePricePercent.multiplyDecimal(currentStrikePrice);
  }

  function calculateHedgePositionSize() internal view returns (uint totalHedgeSizeAfterFees) {
    // for now we do a full hedge
    uint hedgeCollat = _getFullCollateral(currentStrikePrice, currentStrategy.size)
      .multiplyDecimal(1 - currentStrategy.collatPercent).multiplyDecimal(currentHedgeStrategy.leverageSize);

    (uint fee, ) = IFuturesMarket(futuresMarket).orderFee(int(hedgeCollat));

    totalHedgeSizeAfterFees = hedgeCollat - fee; 
  }

  ////////////////
  // Validation //
  ////////////////

  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function isValidStrike(Strike memory strike) public view returns (bool isValid) {
    if (activeExpiry != strike.expiry) {
      return false;
    }

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = getVols(strikeId)[0];
    int callDelta = getDeltas(strikeId)[0];
    int delta = _isCall() ? callDelta : callDelta - SignedDecimalMath.UNIT;
    uint deltaGap = _abs(currentStrategy.targetDelta - delta);
    return vol >= currentStrategy.minVol && vol <= currentStrategy.maxVol && deltaGap < currentStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(uint strikeId) internal view returns (bool isValid) {
    uint volGWAV = gwavOracle.volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = getVols(_toDynamic(strikeId))[0];

    uint volDiff = (volGWAV >= volSpot) ? volGWAV - volSpot : volSpot - volGWAV;

    return isValid = volDiff < currentStrategy.maxVolVariance;
  }

  /**
   * @dev check if the expiry of the board is valid according to the strategy
   */
  function _isValidExpiry(uint expiry) public view returns (bool isValid) {
    uint secondsToExpiry = _getSecondsToExpiry(expiry);
    isValid = (secondsToExpiry >= currentStrategy.minTimeToExpiry &&
      secondsToExpiry <= currentStrategy.maxTimeToExpiry);
  }

   /////////////////////////////
  // Trade Parameter Helpers //
  /////////////////////////////

  function _getFullCollateral(uint strikePrice, uint amount) internal view returns (uint fullCollat) {
    // calculate required collat based on collatBuffer and collatPercent
    fullCollat = _isBaseCollat() ? amount : amount.multiplyDecimal(strikePrice);
  }

  /**
   * @dev get amount of collateral needed for shorting {amount} of strike, according to the strategy
   */
  function _getBufferCollateral(
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount
  ) internal view returns (uint) {
    uint minCollat = getMinCollateral(optionType, strikePrice, expiry, spotPrice, amount);
    uint minCollatWithBuffer = minCollat.multiplyDecimal(currentStrategy.collatBuffer);

    uint fullCollat = _getFullCollateral(strikePrice, amount);

    return _min(minCollatWithBuffer, fullCollat);
  }

  /**
   * @dev get minimum premium that the vault should receive.
   * param listingId lyra option listing id
   * param size size of trade in Lyra standard sizes
   */
  function _getPremiumLimit(Strike memory strike, bool isMin) internal view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint limitVol = isMin ? currentStrategy.minVol : currentStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall()
      ? minCallPremium.multiplyDecimal(currentStrategy.size)
      : minPutPremium.multiplyDecimal(currentStrategy.size);
  }

  /**
   * @dev use latest optionMarket delta cutoff to determine whether trade delta is out of bounds
   */
  function _isOutsideDeltaCutoff(uint strikeId) internal view returns (bool) {
    MarketParams memory marketParams = getMarketParams();
    int callDelta = getDeltas(_toDynamic(strikeId))[0];
    return callDelta > (int(DecimalMath.UNIT) - marketParams.deltaCutOff) || callDelta < marketParams.deltaCutOff;
  }

  //////////////////////////////
  // Active Strike Management //
  //////////////////////////////

  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveStrike(uint strikeId, uint tradedPositionId) internal {
    if (!_isActiveStrike(strikeId)) {
      strikeToPositionId[strikeId] = tradedPositionId;
      activeStrikeIds.push(strikeId);
    }
  }

  /**
   * @dev remove position data opened in the current round.
   * this can only be called after the position is settled by lyra
   **/
  function _clearAllActiveStrikes() internal {
    if (activeStrikeIds.length != 0) {
      for (uint i = 0; i < activeStrikeIds.length; i++) {
        uint strikeId = activeStrikeIds[i];
        OptionPosition memory position = getPositions(_toDynamic(strikeToPositionId[strikeId]))[0];
        // revert if position state is not settled
        require(position.state != PositionState.ACTIVE, "cannot clear active position");
        delete strikeToPositionId[strikeId];
        delete lastTradeTimestamp[i];
      }
      delete activeStrikeIds;
    }
  }

  function _isActiveStrike(uint strikeId) internal view returns (bool isActive) {
    isActive = strikeToPositionId[strikeId] != 0;
  }

  //////////
  // Misc //
  //////////

  function _isBaseCollat() internal view returns (bool isBase) {
    isBase = (optionType == OptionType.SHORT_CALL_BASE) ? true : false;
  }

  function _isCall() internal view returns (bool isCall) {
    isCall = (optionType == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _getSecondsToExpiry(uint expiry) internal view returns (uint) {
    require(block.timestamp <= expiry, "timestamp expired");
    return expiry - block.timestamp;
  }

  function _abs(int val) internal pure returns (uint) {
    return val >= 0 ? uint(val) : uint(-val);
  }

  function _min(uint x, uint y) internal pure returns (uint) {
    return (x < y) ? x : y;
  }

  function _max(uint x, uint y) internal pure returns (uint) {
    return (x > y) ? x : y;
  }

  // temporary fix - eth core devs promised Q2 2022 fix
  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }

}
