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
  mapping(uint => uint) public strategyToStrikeId;
  mapping(uint => uint) public lastTradeTimestamp;

  address public vault;

  OtusVault public otusVault;
  GWAVOracle public gwavOracle;
  
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

  StrategyDetail public currentStrategy; // this wont change much 
  CurrentStrategyDetail[] public currentStrikeStrategies; // this will change every week possibly
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
    // delete first previous first? 
    currentStrikeStrategies = _currentStrikeStrategies;
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

    CurrentStrategyDetail memory currentStrikeStrategy; 

    for(uint i = 0; i < currentStrikeStrategies.length; i++) {
      currentStrikeStrategy = currentStrikeStrategies[i]; 

      // base asset might not be needed if we only use usd 
      if (_isBaseCollat(currentStrikeStrategy.optionType)) {
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

    }

    _clearAllActiveStrikes();
  }

  function doTrades(OtusVault.StrikeDetail[] memory _strikeDetails) external onlyVault returns (
      uint[] memory positionIds, 
      uint[] memory premiumsReceived, 
      uint[] memory collateralToAdd
    ) {
      OtusVault.StrikeDetail memory strikeDetail;
      uint len = _strikeDetails.length; 
      uint strikeId; 
      uint size; 
      uint _positionId; 
      uint _premiumReceived; 
      uint _collateralToAdd;

      for(uint i = 0; i < len; i++) {
        strikeDetail = _strikeDetails[i];
        strikeId = strikeDetail.strikeId; 
        size = strikeDetail.size;

        (_positionId, _premiumReceived, _collateralToAdd) = doTrade(strikeId, size, i);
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
  function doTrade(uint strikeId, uint size, uint _currentStrikeStrategyIndex)
    private returns (
      uint positionId,
      uint premiumReceived,
      uint collateralToAdd
    )
  {
    CurrentStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[_currentStrikeStrategyIndex];
    // validate trade
    require(
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp,
      "min time interval not passed"
    );
    require(_isValidVolVariance(strikeId, currentStrikeStrategy), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike, currentStrikeStrategy), "invalid strike");

    uint setCollateralTo;
    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike, size, currentStrikeStrategy.optionType);

    require(
      collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
      "collateral transfer from vault failed"
    );

    (positionId, premiumReceived) = _sellStrike(strike, size, setCollateralTo, _currentStrikeStrategyIndex);
  }

  function getCollateral(uint strikeId, uint _size, uint _optionType) public view returns (uint, uint, uint) {
    
    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(strike, _size, _optionType);
    return (
      collateralToAdd, 
      setCollateralTo, 
      collateralAsset.balanceOf(address(vault))
    ); 

  }

  /**
   * @dev calculate required collateral to add in the next trade.
   * sell size is fixed as currentStrategy.size
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   */
  function getRequiredCollateral(Strike memory strike, uint _size, uint _optionType)
    public
    view
    returns (uint collateralToAdd, uint setCollateralTo)
  {
    uint sellAmount = _size;
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
      existingAmount + sellAmount,
      _optionType
    );

    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = existingCollateral +
      _getFullCollateral(strike.strikePrice, sellAmount, _optionType).multiplyDecimal(currentStrategy.collatPercent);

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
    uint _size, 
    uint setCollateralTo,
    uint _currentStrikeStrategyIndex
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    CurrentStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[_currentStrikeStrategyIndex]; 
    uint minExpectedPremium = _getPremiumLimit(strike, _size, true, currentStrikeStrategy);
    // perform trade

    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 4,
        optionType: optionType,
        amount: _size, // size should be different depending on strategy 
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, _currentStrikeStrategyIndex);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  /**
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   */
  function reducePosition(
    uint positionId,
    uint size, 
    uint closeAmount
  ) external onlyVault {
    OptionPosition memory position = getPositions(_toDynamic(positionId))[0];
    Strike memory strike = getStrikes(_toDynamic(position.strikeId))[0];
    require(strikeToPositionId[position.strikeId] == positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    require(
      closeAmount <= getAllowedCloseAmount(position, strike.strikePrice, strike.expiry, uint(position.optionType)),
      "amount exceeds allowed close amount"
    );

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(strike, size, false);
    TradeInputParameters memory tradeParams = TradeInputParameters({
      strikeId: position.strikeId,
      positionId: position.positionId,
      iterations: 3,
      optionType: position.optionType,
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
    if (_isBaseCollat(position.optionType)) {
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
    uint strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    console.log("getAllowedCloseAmount", strikePrice, strikeExpiry, exchangeParams.spotPrice);
    uint minCollatPerAmount = _getBufferCollateral(strikePrice, strikeExpiry, exchangeParams.spotPrice, 1e18, _optionType);
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
  // function _openKwentaPosition(uint hedgeAttempts) public onlyVault returns (bool activeShort) {
  //   require(currentHedgeStrategy.maxHedgeAttempts <= hedgeAttempts); 
  //   require(!activeShort, "Active futures hedge");
  //   // uint marginDelta; // 1 - (collateral * .85) * leverage required uint "-" is for shorts
  //   uint marginDelta = calculateHedgePositionSize();
  //   _modifyPosition(int(marginDelta));
  //   hedgeAttempts += 1; 
  //   activeShort = true; 
  //   emit HedgeModifyPosition(msg.sender, marginDelta, hedgeAttempts);
  // }

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

  // function calculateHedgePositionSize() internal view returns (uint totalHedgeSizeAfterFees) {
  //   // for now we do a full hedge - hedge only available for sell puts
  //   uint hedgeCollat = _getFullCollateral(currentStrikePrice, currentStrategy.size, 0)
  //     .multiplyDecimal(1 - currentStrategy.collatPercent).multiplyDecimal(currentHedgeStrategy.leverageSize);

  //   (uint fee, ) = _orderFee(int(hedgeCollat));

  //   totalHedgeSizeAfterFees = hedgeCollat - fee; 
  // }

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
    int delta = _isCall(currentStrikeStrategy.optionType) ? callDelta : callDelta - SignedDecimalMath.UNIT;
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

  function _getFullCollateral(uint strikePrice, uint amount, uint _optionType) internal view returns (uint fullCollat) {
    // calculate required collat based on collatBuffer and collatPercent
    fullCollat = _isBaseCollat(_optionType) ? amount : amount.multiplyDecimal(strikePrice);
  }

  /**
   * @dev get amount of collateral needed for shorting {amount} of strike, according to the strategy
   */
  function _getBufferCollateral(
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount,
    uint _optionType
  ) internal view returns (uint) {

    uint minCollat = getMinCollateral(OptionType(_optionType), strikePrice, expiry, spotPrice, amount);
    uint minCollatWithBuffer = minCollat.multiplyDecimal(currentStrategy.collatBuffer);

    uint fullCollat = _getFullCollateral(strikePrice, amount, _optionType);

    return _min(minCollatWithBuffer, fullCollat);
  }

  /**
   * @dev get minimum premium that the vault should receive.
   * param listingId lyra option listing id
   * param size size of trade in Lyra standard sizes
   */
  function _getPremiumLimit(
      Strike memory strike, 
      uint _size,
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

    limitPremium = _isCall(currentStrikeStrategy.optionType)
      ? minCallPremium.multiplyDecimal(_size)
      : minPutPremium.multiplyDecimal(_size);
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
  function _addActiveStrike(uint strikeId, uint tradedPositionId, uint currentStrategyDetailIndex) internal {
    if (!_isActiveStrike(strikeId)) {
      strikeToPositionId[strikeId] = tradedPositionId;
      strategyToStrikeId[strikeId] = currentStrategyDetailIndex;
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
        delete strategyToStrikeId[strikeId];
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

  function _isBaseCollat(uint _optionType) internal view returns (bool isBase) {
    isBase = (OptionType(_optionType) == OptionType.SHORT_CALL_BASE) ? true : false;
  }

  function _isCall(uint _optionType) public view returns (bool isCall) {
    isCall = (OptionType(_optionType) == OptionType.SHORT_PUT_QUOTE) ? false : true;
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
