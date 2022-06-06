//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

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

  IERC20 public collateralAsset; 

  uint public activeExpiry;
  uint public activeBoardId;

  uint[] public activeStrikeIds;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public strategyToStrikeId;
  mapping(uint => uint) public lastTradeTimestamp;
  mapping(uint => uint) public lastTradeOptionType;

  address public vault;

  OtusVault public otusVault;
  GWAVOracle public gwavOracle;
  
  // strategies can be updated by different strategizers
  struct StrategyDetail {
    uint collatBuffer; // slider - multiple of vaultAdapter.minCollateral(): 1.1 -> 110% * minCollat
    uint collatPercent; // slider - partial collateral: 0.9 -> 90% * fullCollat
    uint minTimeToExpiry; // slider 
    uint maxTimeToExpiry; // slider
    uint minTradeInterval; // slider
    uint gwavPeriod; // slider
    
  }

  struct StrikeStrategyDetail {
    int targetDelta; // slider
    uint maxDeltaGap; // slider
    uint minVol; // slider
    uint maxVol; // slider
    uint maxVolVariance; // slider
    uint optionType; 
    uint strikeId;
    uint size; 
    // uint collateralToAdd; // added for testing from ui
    // uint setCollateralTo; // added for testing from ui
  }

  struct HedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint maxHedgeAttempts; // 
    uint limitStrikePricePercent; // ex. strike price of 3100 2% ~ 3030
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; 
  }

  StrategyDetail public currentStrategy; // this wont change much 
  StrikeStrategyDetail[] public currentStrikeStrategies; // this will change every week possibly
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
    collateralAsset = IERC20(marketAddresses[0]);
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
  }

  function setHedgeStrategy(
      HedgeDetail memory _hedgeStrategy
    ) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentHedgeStrategy = _hedgeStrategy; 
  }

  function getCurrentStrikeStrategies() public view returns (StrikeStrategyDetail[] memory) {
    return currentStrikeStrategies; 
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

  function doTrades(
      StrikeStrategyDetail[] memory _currentStrikeStrategies
    ) external onlyVault returns (
      uint[] memory, 
      uint[] memory, 
      uint[] memory
    ) {
      StrikeStrategyDetail memory strikeDetail;
      uint len = _currentStrikeStrategies.length; 

      uint[] memory positionIds = new uint[](len);
      uint[] memory premiumsReceived = new uint[](len);
      uint[] memory collateralToAdd = new uint[](len);

      uint strikeId; 
      uint size; 
      uint _positionId; 
      uint _premiumReceived; 
      uint _collateralToAdd;

      for(uint i = 0; i < len; i++) {
        strikeDetail = _currentStrikeStrategies[i];
        strikeId = strikeDetail.strikeId; 
        size = strikeDetail.size;

        (_positionId, _premiumReceived, _collateralToAdd) = doTrade(strikeDetail, i);
        positionIds[i] = _positionId;
        premiumsReceived[i] = _premiumReceived;
        collateralToAdd[i] = _collateralToAdd; 
        
        currentStrikeStrategies.push(StrikeStrategyDetail(
          strikeDetail.targetDelta,
          strikeDetail.maxDeltaGap,
          strikeDetail.minVol,
          strikeDetail.maxVol,
          strikeDetail.maxVolVariance,
          strikeDetail.optionType,
          strikeDetail.strikeId,
          strikeDetail.size
          // strikeDetail.collateralToAdd,
          // strikeDetail.setCollateralTo
        ));
      }

      return (positionIds, premiumsReceived, collateralToAdd); 
  }

  function validateTimeIntervalByOptionType(uint strikeId, uint _optionType) internal view returns (bool) {

    bool valid = true; 

    if (
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp && 
      lastTradeOptionType[strikeId] == _optionType) { 
        valid = false; 
    }

    return valid; 
  }


  /**
  * @notice sell a fix aomunt of options and collect premium
  * @dev the vault should pass in a strike id, and the strategy would verify if the strike is valid on-chain.
  * @param currentStrikeStrategy lyra strikeId to trade
  * @return positionId
  * @return premiumReceived
  * @return collateralToAdd
  */
  function doTrade(StrikeStrategyDetail memory currentStrikeStrategy, uint index)
    private returns (
      uint positionId,
      uint premiumReceived,
      uint collateralToAdd
    )
  {
    uint strikeId = currentStrikeStrategy.strikeId;
    uint size = currentStrikeStrategy.size;
    uint optionType = currentStrikeStrategy.optionType;
    require(
      validateTimeIntervalByOptionType(strikeId, optionType),
      "min time interval not passed for option type"
    );

    require(_isValidVolVariance(strikeId, currentStrikeStrategy), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike, currentStrikeStrategy), "invalid strike");

    uint setCollateralTo;
    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike, size, optionType);

    // collateralToAdd = currentStrikeStrategy.collateralToAdd;
    // uint setCollateralTo = currentStrikeStrategy.setCollateralTo;

    require(
      collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
      "collateral transfer from vault failed"
    );

    (positionId, premiumReceived) = _sellStrike(strike, size, setCollateralTo, currentStrikeStrategy, index);
  }

  
  /**
   * @dev convert premium in quote asset into collateral asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint quoteBal = quoteAsset.balanceOf(address(this));

    StrikeStrategyDetail memory currentStrikeStrategy; 

    bool hasBaseCollat = false; 
    bool hasQuoteCollat = false; 

    for(uint i = 0; i < currentStrikeStrategies.length; i++) {
      currentStrikeStrategy = currentStrikeStrategies[i]; 

      // base asset might not be needed if we only use usd 
      if (_isBaseCollat(currentStrikeStrategy.optionType)) {
        hasBaseCollat = true; 
      } else {
        hasQuoteCollat = true; 
      }

    }
    
    if(hasBaseCollat) {
      // exchange quote asset to base asset, and send base asset back to vault
      uint baseBal = baseAsset.balanceOf(address(this));
      uint minQuoteExpected = quoteBal.divideDecimal(exchangeParams.spotPrice).multiplyDecimal(
        DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
      );
      uint baseReceived = exchangeFromExactQuote(quoteBal, minQuoteExpected);
      require(baseAsset.transfer(address(vault), baseBal + baseReceived), "failed to return funds from strategy");
    }

    if(hasQuoteCollat) {
      // send quote balance directly
      require(quoteAsset.transfer(address(vault), quoteBal), "failed to return funds from strategy");
    }

    _clearAllActiveStrikes();
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
    uint targetCollat = existingCollateral + _getFullCollateral(strike.strikePrice, sellAmount, _optionType).multiplyDecimal(currentStrategy.collatPercent);

    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;

  }

  /**
   * @dev perform the trade
   * @param strike strike detail
   * @param _size target collateral amount
   * @param setCollateralTo target collateral amount
   * @param currentStrikeStrategy target collateral amount
   * @param strategyIndex target collateral amount
   * @return positionId
   * @return premiumReceived
   */
  function _sellStrike(
    Strike memory strike,
    uint _size, 
    uint setCollateralTo,
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint strategyIndex
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true, currentStrikeStrategy);
    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size, // size should be different depending on strategy 
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

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
      closeAmount <= getAllowedCloseAmount(position, strike.strikePrice, strike.expiry, uint(position.optionType)),
      "amount exceeds allowed close amount"
    );

    uint currentStrikeStrategyIndex = strategyToStrikeId[position.strikeId];
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[currentStrikeStrategyIndex]; 

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(strike, false, currentStrikeStrategy);
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
    if (_isBaseCollat(uint(position.optionType))) {
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
    uint minCollatPerAmount = _getBufferCollateral(strikePrice, strikeExpiry, exchangeParams.spotPrice, 1e18, _optionType);

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

  // /**
  // * @dev update the strategy for the new round.
  // * strategy should be updated weekly after previous round ends 
  // */
  // function calculateReducePositionPrice() internal view returns (uint strikeLimitPrice) {
  //   strikeLimitPrice = currentHedgeStrategy.limitStrikePricePercent.multiplyDecimal(currentStrikePrice);
  // }

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
  function isValidStrike(Strike memory strike, StrikeStrategyDetail memory currentStrikeStrategy) public view returns (bool isValid) {
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
  function _isValidVolVariance(uint strikeId, StrikeStrategyDetail memory currentStrikeStrategy) internal view returns (bool isValid) {
    uint volGWAV = gwavOracle.volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = getVols(_toDynamic(strikeId))[0];

    uint volDiff = (volGWAV >= volSpot) ? volGWAV - volSpot : volSpot - volGWAV;

    return isValid = volDiff < currentStrikeStrategy.maxVolVariance;
  }

  /**
   * @dev check if the expiry of the board is valid according to the strategy
   */
  function _isValidExpiry(uint expiry) internal view returns (bool isValid) {
    uint secondsToExpiry = _getSecondsToExpiry(expiry);

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
    require(minCollat > 0, "min collat must be more");
    uint minCollatWithBuffer = minCollat.multiplyDecimal(currentStrategy.collatBuffer);

    uint fullCollat = _getFullCollateral(strikePrice, amount, _optionType);
    require(fullCollat > 0, "fullCollat collat must be more");

    return _min(minCollatWithBuffer, fullCollat);

  }

  function _getPremiumLimit(
      Strike memory strike, 
      bool isMin, 
      StrikeStrategyDetail memory currentStrikeStrategy
    ) public view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint limitVol = isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall(currentStrikeStrategy.optionType)
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
        delete lastTradeOptionType[i];
      }
      delete activeStrikeIds;
      delete currentStrikeStrategies; 
    }
  }

  function _clearCurrentStrategyStrikes() public {
    delete currentStrikeStrategies; 
  }

  function _isActiveStrike(uint strikeId) internal view returns (bool isActive) {
    isActive = strikeToPositionId[strikeId] != 0;
  }

  //////////////////
  // View Strikes //
  //////////////////

  function getActiveStrikeIds() public view returns (uint[] memory) {
    return activeStrikeIds; 
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
