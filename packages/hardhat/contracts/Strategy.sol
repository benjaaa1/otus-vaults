//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Hardhat
import "hardhat/console.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";

// Libraries
import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import './synthetix/SignedSafeDecimalMath.sol';
import './synthetix/SafeDecimalMath.sol';
// Vault 
import {Vault} from "./libraries/Vault.sol";
import {OtusVault} from "./OtusVault.sol";
import {VaultAdapter} from "./VaultAdapter.sol";
import {FuturesAdapter} from "./FuturesAdapter.sol";
import {TokenAdapter} from "./TokenAdapter.sol";

contract Strategy is FuturesAdapter, VaultAdapter, TokenAdapter {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  uint public activeExpiry;
  uint public activeBoardId;

  uint[] public activeStrikeIds;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public lastTradeTimestamp;

  address public vault;

  OtusVault public otusVault;
  GWAVOracle public gwavOracle;
  
  OptionType public optionType;
  IERC20 public collateralAsset;

  uint public currentStrikePrice;

  // strategies can be updated by different strategizers
  struct StrategyDetail {
    uint collatBuffer; // slider - multiple of vaultAdapter.minCollateral(): 1.1 -> 110% * minCollat
    uint collatPercent; // slider - partial collateral: 0.9 -> 90% * fullCollat
    uint minTimeToExpiry; // slider 
    uint maxTimeToExpiry; // slider
    uint minTradeInterval; // slider
    uint gwavPeriod; // slider
    
  }

  struct CurrentStrategyDetail {
    int targetDelta; // slider
    uint maxDeltaGap; // slider
    uint minVol; // slider
    uint maxVol; // slider
    uint maxVolVariance; // slider
    uint optionType; 
  }

  struct HedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint maxHedgeAttempts; // 
    uint limitStrikePricePercent; // ex. strike price of 3100 2% ~ 3030
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; 
  }

  StrategyDetail public currentStrategy;
  CurrentStrategyDetail[] public currentStrikeStrategies; 
  HedgeDetail public currentHedgeStrategy;

  /************************************************
   *  EVENTS
   ***********************************************/

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

  constructor(address _synthetixAdapter) FuturesAdapter() VaultAdapter(_synthetixAdapter) TokenAdapter() {}

  function initialize(
    address _owner, 
    address _vault, 
    address[] memory marketAddresses,
    address _gwavOracle
  ) external { 

    gwavOracle = GWAVOracle(_gwavOracle);

    optionInitialize(
      marketAddresses[2],	// marketAddress.optionToken,
      marketAddresses[3],	// marketAddress.optionMarket,
      marketAddresses[4],	// marketAddress.liquidityPool,
      marketAddresses[5],	// marketAddress.shortCollateral,
      marketAddresses[6],  // optionPricer
      marketAddresses[7]  // greekCache
    );

    futuresInitialize(marketAddresses[8]);

    baseInitialize(
      _owner, 
      _vault,
      marketAddresses[8], 
      marketAddresses[3],	// marketAddress.optionMarket, 
      marketAddresses[0],  // quote asset
      marketAddresses[1]   // base asset
    ); 

    vault = _vault;
    otusVault = OtusVault(_vault); 

    optionType = OptionType(otusVault.optionType());
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  * quoteAsset usually USD baseAsset usually ETH
  */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    
    currentStrategy = _currentStrategy;
    collateralAsset = _isBaseCollat() ? baseAsset : quoteAsset;
  }

  function setCurrentStrategy(
      CurrentStrategyDetail memory _currentStrikeStrategy,
      HedgeDetail memory _hedgeStrategy
    ) external onlyOwner {
      (, , , , , , , bool roundInProgress) = otusVault.vaultState();
      require(!roundInProgress, "round opened");
      currentStrikeStrategies[0] = _currentStrikeStrategy; 
      currentHedgeStrategy = _hedgeStrategy; 

    }

  function setCurrentStrategy(CurrentStrategyDetail[] memory _currentStrikeStrategies) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    uint len = _currentStrikeStrategies.length; 
    // delete first? 
    currentStrikeStrategies = new CurrentStrategyDetail[](len);

    for(uint i = 0; i < len; i++) {
      currentStrikeStrategies[i] = _currentStrikeStrategies[i];
    }
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @dev set the board id that will be traded for the next round
   * @param boardId lyra board Id.
   */
  function setBoard(uint boardId) external {
    require(boardId > 0, "Board Id incorrect");
    Board memory board = getBoard(boardId);
    require(_isValidExpiry(board.expiry), "invalid board");
    activeExpiry = board.expiry;
    activeBoardId = boardId; 
  }

  // function _getBoard(uint boardId) public view returns (uint, uint, uint, uint, uint, bool) {
  //   Board memory board = getBoard(boardId); 
  //   return (boardId, board.id, board.boardIv, block.timestamp, board.expiry, block.timestamp <= board.expiry);
  // }

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

  function doTrades(uint[] calldata strikeIds) external onlyVault returns (
      uint[] memory positionIds, 
      uint[] memory premiumsReceived, 
      uint[] memory collateralToAdd
    ) {
    uint len = strikeIds.length; 
    uint _positionId; 
    uint _premiumReceived; 
    uint _collateralToAdd;

    for(uint i = 0; i < len; i++) {
      (_positionId, _premiumReceived, _collateralToAdd) = doTrade(strikeIds[i], currentStrikeStrategies[i]);
      positionIds[i] = _positionId;
      premiumsReceived[i] = _premiumReceived;
      collateralToAdd[i] = _collateralToAdd; 
    }
  }


    /**
   * @notice sell a fix aomunt of options and collect premium
   * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
   * @param strikeId lyra strikeId to trade
   * @return positionId
   * @return premiumReceived
   */
  function doTrade(uint strikeId, CurrentStrategyDetail memory currentStrikeStrategy)
    private returns (
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
    require(_isValidVolVariance(strikeId, currentStrikeStrategy), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike, currentStrikeStrategy), "invalid strike");

    uint setCollateralTo;
    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike);

    require(
      collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
      "collateral transfer from vault failed"
    );

    (positionId, premiumReceived) = _sellStrike(strike, setCollateralTo, currentStrikeStrategy);
  }

  function getCollateral(uint strikeId) public view returns (uint, uint, uint) {
    
    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(strike);
    return (
      collateralToAdd, 
      setCollateralTo, 
      collateralAsset.balanceOf(address(vault))
    ); 

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
    uint setCollateralTo,
    CurrentStrategyDetail memory currentStrikeStrategy
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true, currentStrikeStrategy);
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
    console.log("getAllowedCloseAmount", strikePrice, strikeExpiry, exchangeParams.spotPrice);
    uint minCollatPerAmount = _getBufferCollateral(strikePrice, strikeExpiry, exchangeParams.spotPrice, 1e18);
    console.log("minCollatPerAmount", minCollatPerAmount);
    console.log("position.collateral", position.collateral);
    console.log("position.amount", position.amount); 
    console.log("minCollatPerAmount.multiplyDecimal(position.amount)", minCollatPerAmount.multiplyDecimal(position.amount));

    closeAmount = position.collateral < minCollatPerAmount.multiplyDecimal(position.amount)
      ? position.amount - position.collateral.divideDecimal(minCollatPerAmount)
      : 0;
  }
// getAllowedCloseAmount 2700000000000000000000 1653672335 2600000000000000000000
// minCollatPerAmount 847860939801925427994
// position.collateral 40500000000000000000000
// position.amount 15000000000000000000
// minCollatPerAmount.multiplyDecimal(position.amount) 12717914097028881419910


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
    _modifyPosition(int(marginDelta));
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
    _closePosition();
    _withdrawAllMargin();
    // transfer all funds back to vault state
    (uint marginRemaining, bool invalid) = _remainingMargin(); 
    require(!invalid, "remaining margin negative"); 
    quoteAsset.transfer(address(vault), marginRemaining);

    activeShort = false; 
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

    (uint fee, ) = _orderFee(int(hedgeCollat));

    totalHedgeSizeAfterFees = hedgeCollat - fee; 
  }

  ////////////////
  // Validation //
  ////////////////

  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function isValidStrike(Strike memory strike, CurrentStrategyDetail memory currentStrikeStrategy) public view returns (bool isValid) {
    if (activeExpiry != strike.expiry) {
      return false;
    }

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = getVols(strikeId)[0];
    int callDelta = getDeltas(strikeId)[0];
    int delta = _isCall() ? callDelta : callDelta - SignedDecimalMath.UNIT;
    uint deltaGap = _abs(currentStrikeStrategy.targetDelta - delta);

    return vol >= currentStrikeStrategy.minVol && vol <= currentStrikeStrategy.maxVol && deltaGap < currentStrikeStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(uint strikeId, CurrentStrategyDetail memory currentStrikeStrategy) internal view returns (bool isValid) {
    uint volGWAV = gwavOracle.volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = getVols(_toDynamic(strikeId))[0];

    uint volDiff = (volGWAV >= volSpot) ? volGWAV - volSpot : volSpot - volGWAV;
    console.log("volDiff", volDiff, currentStrikeStrategy.maxVolVariance);
    return isValid = volDiff < currentStrikeStrategy.maxVolVariance;
  }

  /**
   * @dev check if the expiry of the board is valid according to the strategy
   */
  function _isValidExpiry(uint expiry) internal view returns (bool isValid) {
    uint secondsToExpiry = _getSecondsToExpiry(expiry);
    console.log("secondsToExpiry", secondsToExpiry); 
    console.log("currentStrategy.minTimeToExpiry", currentStrategy.minTimeToExpiry); 
    console.log("currentStrategy.maxTimeToExpiry", currentStrategy.maxTimeToExpiry); 

    isValid = (secondsToExpiry >= currentStrategy.minTimeToExpiry && secondsToExpiry <= currentStrategy.maxTimeToExpiry);
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
  function _getPremiumLimit(
      Strike memory strike, 
      bool isMin, 
      CurrentStrategyDetail memory currentStrikeStrategy
    ) internal view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint limitVol = isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall()
      ? minCallPremium.multiplyDecimal(currentStrikeStrategy.size)
      : minPutPremium.multiplyDecimal(currentStrikeStrategy.size);
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

  function _isCall() public view returns (bool isCall) {
    isCall = (optionType == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _getSecondsToExpiry(uint expiry) internal view returns (uint) {
    console.log("block.timestamp", block.timestamp); 
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
