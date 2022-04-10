//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Hardhat
import "hardhat/console.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {VaultAdapter} from '@lyrafinance/core/contracts/periphery/VaultAdapter.sol';
import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import {DecimalMath} from "@lyrafinance/core/contracts/synthetix/DecimalMath.sol";
import {SignedDecimalMath} from "@lyrafinance/core/contracts/synthetix/SignedDecimalMath.sol";
import '../synthetix/interfaces/IFuturesMarket.sol';

// Libraries
import '../synthetix/SignedSafeDecimalMath.sol';
import '../synthetix/SafeDecimalMath.sol';

// Vault 
import {Vault} from "../libraries/Vault.sol";
import {OtusVault} from "../OtusVault.sol";

contract Strategy is VaultAdapter, Initializable {
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

  OtusVault otusVault;
  OptionType optionType;
  GWAVOracle public immutable gwavOracle;
  IERC20 public collateralAsset;

  uint public currentStrikePrice;
  uint setCollateralTo;

  // strategies can be updated by different strategizers
  struct StrategyDetail {
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

  struct StrategyHedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint256 maxHedgeAttempts; // 
    uint256 limitStrikePricePercent; // ex. strike price of 3100 2% ~ 3030
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; 
  }

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  */
  function calculateReducePositionPrice() internal view returns (uint strikeLimitPrice) {
    strikeLimitPrice = currentHedgeStrategy.limitStrikePricePercent.multiplyDecimal(currentStrikePrice);
  }

  function calculateHedgePositionSize() internal returns (uint totalHedgeSizeAfterFees) {
    // for now we do a full hedge
    uint hedgeCollat = _getFullCollateral(currentStrikePrice, currentStrategy.size)
      .multiplyDecimal(1 - currentStrategy.collatPercent).multiplyDecimal(currentHedgeStrategy.leverageSize);

    (uint fee, ) = IFuturesMarket(futuresMarket).orderFee(int(hedgeCollat));

    uint totalHedgeSizeAfterFees = hedgeCollat - fee; 
  }

  StrategyDetail public currentStrategy;
  StrategyHedgeDetail public currentHedgeStrategy;

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

  constructor(GWAVOracle _gwavOracle) VaultAdapter() {
        gwavOracle = _gwavOracle;
  }

  function initialize(address _vault) external initializer {
    vault = _vault;
    otusVault = OtusVault(_vault); 
    futuresMarket = otusVault.futuresMarket();

    (,, address asset) = otusVault.vaultParams();

    collateralAsset = IERC20(asset);
  }

  /************************************************
  *  SETTERS
  ***********************************************/

  /**
  * @dev update the strategy for the new round.
  * strategy should be updated weekly after previous round ends 
  */
  function setStrategy(StrategyDetail memory _strategy, StrategyHedgeDetail memory _hedgeStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress) = otusVault.vaultState();
    require(!roundInProgress, "round opened");
    currentStrategy = _strategy;
    currentHedgeStrategy = _hedgeStrategy; 
  }

  /************************************************
  *  VAULT ACTIONS
  ***********************************************/
   
  /**
  * @dev set the board id that will be traded for the next round
  */
  function setBoard() external onlyVault {
    uint[] memory liveBoards = getLiveBoards(); 
    Board memory board = getBoard(liveBoards[0]);
    require(_isValidExpiry(board.expiry), "invalid board");
    activeExpiry = board.expiry;
  }

  /**
   * @dev convert premium into quote asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint quoteBal = quoteAsset.balanceOf(address(this));

    uint quoteReceived = 0;
    if (_isBaseCollat()) {
      // todo: double check this
      uint baseBal = baseAsset.balanceOf(address(this));
      uint minQuoteExpected = baseBal.multiplyDecimal(exchangeParams.spotPrice).multiplyDecimal(
        DecimalMath.UNIT - exchangeParams.baseQuoteFeeRate
      );
      quoteReceived = exchangeFromExactBase(baseBal, minQuoteExpected);
    }
    require(quoteAsset.transfer(address(vault), quoteBal + quoteReceived), "failed to return funds from strategy");

    _clearAllActiveStrikes();
  }

  /**
  * @notice request trade detail according to the strategy. 
  */
  function startTradeForRound(uint strikeId, uint collateral) 
    external onlyVault returns (
      uint positionId,
      uint premiumReceived,
      uint collateralToAdd
    ) {

    // validate trade
    require(
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp,
      "min time interval not passed"
    );
    require(_isValidVolVariance(strikeId), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];
    require(isValidStrike(strike), "invalid strike");

    (collateralToAdd, setCollateralTo) = getRequiredCollateral(strike);

    require(
      collateralAsset.transferFrom(address(vault), address(this), collateralToAdd),
      "collateral transfer from vault failed"
    );

    // multiply setCollateralTo

    (positionId, premiumReceived) = _sellStrike(strike, setCollateralTo);
    
    // set strike 
    currentStrikePrice = strike.strikePrice; 

    uint256 hedgeCollateral = collateral.sub(collateral.multiplyDecimal(currentHedgeStrategy.hedgePercentage / 100));
    IFuturesMarket(futuresMarket).transferMargin(int256(hedgeCollateral));

  }

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
        amount: currentStrategy.size,
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: otusVault.supervisor() // set to zero address if don't want to wait for whitelist
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
  function reducePosition(uint positionId) external onlyVault {
    OptionPosition memory position = getPositions(_toDynamic(positionId))[0];
    Strike memory strike = getStrikes(_toDynamic(position.strikeId))[0];
    ExchangeRateParams memory exchangeParams = getExchangeParams();

    require(strikeToPositionId[position.strikeId] != positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    uint minCollatPerAmount = _getBufferCollateral(strike.strikePrice, strike.expiry, exchangeParams.spotPrice, 1e18);
    require(
      position.collateral < minCollatPerAmount.multiplyDecimal(position.amount),
      "position properly collateralized"
    );

    // closes excess position with premium balance
    uint closeAmount = position.amount - position.collateral.divideDecimal(minCollatPerAmount);
    uint maxExpectedPremium = _getPremiumLimit(strike, false);
    TradeResult memory result = closePosition(
      TradeInputParameters({
        strikeId: position.strikeId,
        positionId: position.positionId,
        iterations: 3,
        optionType: optionType,
        amount: closeAmount,
        setCollateralTo: position.collateral,
        minTotalCost: type(uint).min,
        maxTotalCost: maxExpectedPremium,
        rewardRecipient: otusVault.supervisor() // set to zero address if don't want to wait for whitelist
      })
    );

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

  /************************************************
   *  VALIDATION
   ***********************************************/

  function isValidBoard(Board memory board) public view returns (bool isValid) {
    return _isValidExpiry(board.expiry);
  }

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

  /************************************************
   *  TRADE PARAMETER HELPERS
   ***********************************************/

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

  /************************************************
   *  ACTIVE STRIKE MANAGEMENT
   ***********************************************/
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

  /************************************************
   *  MISC
   ***********************************************/

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
