//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

import 'hardhat/console.sol';

// Interfaces
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '../../interfaces/ILyraBase.sol';
import '../../interfaces/IFuturesMarket.sol';

// Libraries
import '../../synthetix/SignedSafeDecimalMath.sol';
import '../../synthetix/SafeDecimalMath.sol';
import '../../synthetix/SignedSafeMath.sol';
import {SignedDecimalMath} from '@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol';
import {DecimalMath} from '@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol';
import {Vault} from '../../libraries/Vault.sol';

// Vault
import {OtusVault} from '../OtusVault.sol';

// Inherited
import {StrategyBase} from './StrategyBase.sol';

/**
 * @title Strategy
 * @author Lyra
 * @dev Executes strategy for vault based on settings with hedge support
 */
contract Strategy is StrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  // address of vault it's strategizing for
  address public vault;

  // instance of vault it's strategizing for
  OtusVault public otusVault;

  /************************************************
   *  EVENTS
   ***********************************************/

  event HedgeClosePosition(address closer, uint spotPrice, uint positionId);

  event Hedge(HEDGETYPE _hedgeType, int size, uint spotPrice, uint positionId);

  event StrikeStrategyUpdated(address vault, StrikeStrategyDetail[] currentStrikeStrategies);

  event StrategyUpdated(address vault, StrategyDetail updatedStrategy);

  event StrategyHedgeTypeUpdated(address vault, HEDGETYPE hedgeType);

  event HedgeStrategyUpdated(address vault, DynamicDeltaHedgeStrategy dynamicStrategy);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault() {
    require(msg.sender == vault, 'NOT_VAULT');
    _;
  }

  /************************************************
   *  ERRORS
   ***********************************************/

  /// @notice market has to be allowed
  /// @param market: name of the market
  error MarketNotAllowed(bytes32 market);

  /// @notice strike has to be valid
  /// @param strikeId lyra strikeid
  /// @param market name of the market
  error InvalidStrike(uint strikeId, bytes32 market);

  /// @notice premium below expected
  /// @param actual actual premium
  /// @param expected expected premium
  error PremiumBelowExpected(uint actual, uint expected);

  /// @notice price above expected
  /// @param actual actual premium
  /// @param expected expected premium
  error PremiumAboveExpected(uint actual, uint expected);

  /// @notice close amount above allowed
  /// @param closeAmount amount requested
  error CloseAmountExceedsAllowed(uint closeAmount);

  /// @notice position id not found
  /// @param positionId position id
  error InvalidPositionId(uint positionId);

  /// @notice futures market not set
  error NoFuturesMarketSet();

  /************************************************
   *  ADMIN
   ***********************************************/

  /**
   * @notice
   */
  constructor(address _quoteAsset, address _otusController) StrategyBase(_quoteAsset, _otusController) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   * @param _currentStrategy vault strategy settings
   */
  function initialize(address _owner, address _vault, StrategyDetail memory _currentStrategy) external {
    baseInitialize(_owner, _vault, _currentStrategy);
    vault = _vault;

    emit StrategyUpdated(_vault, _currentStrategy);
  }

  /************************************************
   *  SETTERS
   ***********************************************/

  /**
   * @notice Update the strategy for the new round
   * @param _currentStrategy vault strategy settings
   */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, 'round opened');
    currentStrategy = _currentStrategy;

    // after strategy is set need to update allowed markets :
    _setAllowedMarkets(currentStrategy.allowedMarkets);

    emit StrategyUpdated(vault, currentStrategy);
  }

  /**
   * @notice one type of hedge strategy allowed
   * @param _hedgeType hedge type
   */
  function setHedgeStrategyType(uint _hedgeType) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, 'round opened');
    hedgeType = HEDGETYPE(_hedgeType);
    emit StrategyHedgeTypeUpdated(vault, hedgeType);
  }

  /**
   * @notice Update the strike hedge strategy
   * @param _dynamicStrategy vault strategy settings
   * @dev should be able to accept multiple strategy types (1 click / delta / auto simple)
   */
  function setHedgeStrategies(DynamicDeltaHedgeStrategy memory _dynamicStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, 'round opened');

    dynamicHedgeStrategy = _dynamicStrategy;
    emit HedgeStrategyUpdated(vault, dynamicHedgeStrategy);
  }

  /**
   * @notice Update the strike strategy by option
   * @param _currentStrikeStrategies different strike strategies for each option type supported
   */
  function setStrikeStrategyDetail(
    StrikeStrategyDetail[] memory _currentStrikeStrategies
  ) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, 'round opened');

    uint len = _currentStrikeStrategies.length;
    StrikeStrategyDetail memory currentStrikeStrategy;

    for (uint i = 0; i < len; i++) {
      currentStrikeStrategy = _currentStrikeStrategies[i];
      currentStrikeStrategies[currentStrikeStrategy.optionType] = currentStrikeStrategy;
    }

    emit StrikeStrategyUpdated(vault, _currentStrikeStrategies);
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @notice Sell or buy options from vault
   * @dev sell a fix aomunt of options and collect premium or buy a fix amount and pay the price
   * @param _trade lyra strike details to trade
   * @return positionId
   * @return premium
   * @return capitalUsed
   */
  function trade(
    StrikeTrade memory _trade
  ) external onlyVault returns (uint positionId, uint premium, uint capitalUsed, uint expiry) {
    /// @notice check if market is allowed
    if (allowedMarkets[_trade.market] == false) {
      revert MarketNotAllowed(_trade.market);
    }

    (bool _isValid, ILyraBase.Strike memory strike) = _getValidStrike(_trade);

    if (!_isValid) {
      revert InvalidStrike(_trade.strikeId, _trade.market);
    }

    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[_trade.optionType];

    bool isLong = _isLong(currentStrikeStrategy.optionType);
    bool isMin = isLong ? false : true;

    uint premiumLimit = _getPremiumLimit(_trade, strike.expiry, strike.strikePrice, isMin);

    if (isLong) {
      _trasferFromVault(premiumLimit);

      (positionId, premium) = buyStrike(_trade, premiumLimit);

      capitalUsed = premiumLimit;
    } else {
      (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(
        _trade,
        strike.strikePrice,
        strike.expiry
      );

      _trasferFromVault(collateralToAdd);

      (positionId, premium) = sellStrike(_trade, setCollateralTo, premiumLimit);

      capitalUsed = collateralToAdd;
    }

    _addActiveStrike(_trade, positionId);

    expiry = strike.expiry;
  }

  /**
   * @notice transfer from vault
   * @param _amount quote amount to transfer
   */
  function _trasferFromVault(uint _amount) internal onlyVault {
    require(
      quoteAsset.transferFrom(address(vault), address(this), _amount),
      'collateral transfer from vault failed'
    );
  }

  /**
   * @notice Return funds to vault and clera strikes
   * @dev convert premium in quote asset into collateral asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    // need to return the synthetix ones too
    for (uint i = 0; i < markets.length; i++) {
      bytes32 market = markets[i];
      _closeHedgeEndOfRound(market);
    }

    uint quoteBal = quoteAsset.balanceOf(address(this));

    require(quoteAsset.transfer(address(vault), quoteBal), 'failed to return funds from strategy');

    _clearAllActiveStrikes();
  }

  /**
   * @notice Return funds to vault and clera strikes
   * @dev calculate required collateral to add in the next trade.
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   * @param _trade strike trade
   * @param _strikeExpiry expiry
   * @return collateralToAdd
   * @return setCollateralTo
   */
  function getRequiredCollateral(
    StrikeTrade memory _trade,
    uint _strikePrice,
    uint _strikeExpiry
  ) public view returns (uint collateralToAdd, uint setCollateralTo) {
    ILyraBase.ExchangeRateParams memory exchangeParams = lyra(_trade.market).getExchangeParams();

    // get existing position info if active
    uint existingAmount;
    uint existingCollateral;

    if (_isActiveStrike(_trade.strikeId, _trade.optionType)) {
      uint positionId = positionIdByStrikeOption[keccak256(abi.encode(_trade.strikeId, _trade.optionType))];
      ILyraBase.OptionPosition memory position = lyra(_trade.market).getPositions(_toDynamic(positionId))[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }
    // gets minBufferCollat for the whole position
    uint minBufferCollateral = _getBufferCollateral(
      _trade.market,
      _strikePrice,
      _strikeExpiry,
      exchangeParams.spotPrice,
      existingAmount + _trade.size,
      _trade.optionType
    );
    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = existingCollateral +
      _getFullCollateral(_strikePrice, _trade.size, _trade.optionType).multiplyDecimal(
        currentStrategy.collatPercent
      );

    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;
  }

  /**
   * @notice perform the sell
   * @param _trade strike trade info
   * @param _setCollateralTo target collateral amount
   * @param _minExpectedPremium min premium acceptable
   * @return positionId lyra position id
   * @return totalCost the premium received from selling
   */
  function sellStrike(
    StrikeTrade memory _trade,
    uint _setCollateralTo,
    uint _minExpectedPremium
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    OptionType optionType = OptionType(_trade.optionType);
    // perform trade
    console.log('_setCollateralTo');
    console.log(_setCollateralTo);
    TradeResult memory result = openPosition(
      _trade.market,
      TradeInputParameters({
        strikeId: _trade.strikeId,
        positionId: positionIdByStrikeOption[keccak256(abi.encode(_trade.strikeId, _trade.optionType))], // need to get track by strike id and option type
        iterations: 1,
        optionType: optionType,
        amount: _trade.size, // size should be different depending on strategy
        setCollateralTo: _setCollateralTo,
        minTotalCost: _minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );

    if (result.totalCost < _minExpectedPremium) {
      revert PremiumBelowExpected(result.totalCost, _minExpectedPremium);
    }

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice perform the buy
   * @param _trade strike trade info
   * @param _maxPremium max price acceptable
   * @return positionId
   * @return totalCost
   */
  function buyStrike(StrikeTrade memory _trade, uint _maxPremium) internal returns (uint, uint) {
    OptionType optionType = OptionType(_trade.optionType);
    // perform trade to long
    TradeResult memory result = openPosition(
      _trade.market,
      TradeInputParameters({
        strikeId: _trade.strikeId,
        positionId: positionIdByStrikeOption[keccak256(abi.encode(_trade.strikeId, _trade.optionType))],
        iterations: 1,
        optionType: optionType,
        amount: _trade.size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: _maxPremium,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );

    if (result.totalCost > _maxPremium) {
      revert PremiumAboveExpected(result.totalCost, _maxPremium);
    }

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice reduce size of lyra options position
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   * @param _market btc/eth
   * @param _positionId lyra position id
   * @param _closeAmount amount closing
   */
  function reducePosition(bytes32 _market, uint _positionId, uint _closeAmount) external onlyVault {
    ILyraBase.OptionPosition memory position = lyra(_market).getPositions(_toDynamic(_positionId))[0];
    ILyraBase.Strike memory strike = lyra(_market).getStrikes(_toDynamic(position.strikeId))[0];

    if (
      positionIdByStrikeOption[keccak256(abi.encode(position.strikeId, position.optionType))] != _positionId
    ) {
      revert InvalidPositionId(_positionId);
    }

    if (
      _closeAmount >
      getAllowedCloseAmount(
        _market,
        position.amount,
        position.collateral,
        strike.strikePrice,
        strike.expiry,
        uint(position.optionType)
      )
    ) {
      revert CloseAmountExceedsAllowed(_closeAmount);
    }

    StrikeTrade memory currentTrade = activeStrikeByPositionId[_positionId];

    bool isMin = _isLong(currentTrade.optionType) ? false : true;
    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(currentTrade, strike.expiry, strike.strikePrice, isMin);
    TradeInputParameters memory tradeParams = TradeInputParameters({
      strikeId: position.strikeId,
      positionId: position.positionId,
      iterations: 3,
      optionType: OptionType(uint(position.optionType)), // convert to lyraadapter optiontype
      amount: _closeAmount,
      setCollateralTo: position.collateral,
      minTotalCost: type(uint).min,
      maxTotalCost: maxExpectedPremium,
      rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
    });

    TradeResult memory result;
    if (!_isOutsideDeltaCutoff(_market, strike.id)) {
      result = closePosition(_market, tradeParams);
    } else {
      // will pay less competitive price to close position
      result = forceClosePosition(_market, tradeParams);
    }

    require(result.totalCost <= maxExpectedPremium, 'premium paid is above max expected premium');

    // return closed collateral amount
    // quote collateral
    quoteAsset.transfer(address(vault), _closeAmount);
  }

  /**
   * @notice get allowed close amount
   * @dev calculates the position amount required to stay above the buffer collateral
   * @param _market market btc / eth
   * @param _positionAmount current position size
   * @param _positionCollateral current collateral for position
   * @param _strikePrice strike price
   * @param _strikeExpiry strike expiry
   * @param _optionType option type
   */
  function getAllowedCloseAmount(
    bytes32 _market,
    uint _positionAmount,
    uint _positionCollateral,
    uint _strikePrice,
    uint _strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    ILyraBase.ExchangeRateParams memory exchangeParams = lyra(_market).getExchangeParams();
    uint minCollatPerAmount = _getBufferCollateral(
      _market,
      _strikePrice,
      _strikeExpiry,
      exchangeParams.spotPrice,
      1e18,
      _optionType
    );

    closeAmount = _positionCollateral < minCollatPerAmount.multiplyDecimal(_positionAmount)
      ? _positionCollateral - _positionCollateral.divideDecimal(minCollatPerAmount)
      : 0;
  }

  /******************************************************
   * HEDGE WITH SYNTHETIX FUTURES
   *****************************************************/

  /**
   * @notice transfer to synthetix futures market
   * @param _market btc / eth
   * @param _hedgeFunds funds to transfer
   * @dev refactor this to move away from futuresadapter
   */
  function _transferToFuturesMarket(bytes32 _market, int _hedgeFunds) internal {
    // transfer from vault to strategy
    address futuresMarket = futuresMarketsByKey[_market];
    IFuturesMarket(futuresMarket).transferMargin(_hedgeFunds);
  }

  /*****************************************************
   *  DYNAMIC HEDGE - KEEPER
   *****************************************************/

  /**
   * @notice delta hedging using synthetix futures based on strategy
   * @param _market btc or eth
   * @param _deltaToHedge deltaToHedge calcualted by keeper
   * @param _hedgeAttempts attempts
   * @dev refactor this to move away from futuresadapter
   */
  function dynamicDeltaHedge(bytes32 _market, int _deltaToHedge, uint _hedgeAttempts) external onlyVault {
    require(hedgeType == HEDGETYPE.DYNAMIC_DELTA_HEDGE, 'Not allowed');
    require(dynamicHedgeStrategy.maxHedgeAttempts <= _hedgeAttempts);

    address futuresMarket = futuresMarketsByKey[_market];

    (uint marginRemaining, ) = IFuturesMarket(futuresMarket).remainingMargin(address(this));

    require(marginRemaining > 0, 'Remaining margin is 0');

    uint spotPrice = lyra(_market).getSpotPriceForMarket();
    uint fundsRequiredSUSD = _abs(_deltaToHedge).multiplyDecimal(spotPrice); // 20 * 2000 = 40000

    uint currentLeverage = marginRemaining.divideDecimal(fundsRequiredSUSD);

    int size = dynamicHedgeStrategy.maxLeverageSize > currentLeverage
      ? _deltaToHedge
      : _maxLeverageSize(_deltaToHedge, dynamicHedgeStrategy.maxLeverageSize, marginRemaining, spotPrice);

    IFuturesMarket(futuresMarket).modifyPosition(size);
  }

  /*****************************************************
   *  DELTA HEDGE -  CONTROLLED BY USER
   *****************************************************/

  /**
   * @notice one click delta hedge
   * @param _market btc or eth
   * @param _size total size of hedge
   */
  function userHedge(bytes32 _market, int _size) external onlyVault {
    require(hedgeType == HEDGETYPE.USER_HEDGE, 'Not allowed');
    address futuresMarket = futuresMarketsByKey[_market];
    // check if there is enough roundhedgefunds left over

    uint spotPrice = lyra(_market).getSpotPriceForMarket();
    uint fundsRequiredSUSD = _abs(_size).multiplyDecimal(spotPrice);

    _trasferFromVault(fundsRequiredSUSD);
    _transferToFuturesMarket(_market, int(fundsRequiredSUSD));

    (uint marginRemaining, ) = IFuturesMarket(futuresMarket).remainingMargin(address(this));
    require(marginRemaining > 0, 'Remaining margin is 0');

    IFuturesMarket(futuresMarket).modifyPosition(_size);
  }

  /*****************************************************
   *  CLOSE HEDGE
   *****************************************************/

  /**
   * @notice close position
   * @dev refactor this to move away from futuresadapter
   */
  function _closeHedge(bytes32[] memory _markets) external onlyVault {
    for (uint i = 0; i < _markets.length; i++) {
      bytes32 market = _markets[i];
      address futuresMarket = futuresMarketsByKey[market];
      IFuturesMarket(futuresMarket).closePosition();
    }
  }

  /**
   * @notice withdraw margin
   * @dev refactor this to move away from futuresadapter
   */
  function _closeHedgeEndOfRound(bytes32 _market) public {
    if (futuresMarketsByKey[_market] == address(0)) {
      revert NoFuturesMarketSet();
    }

    address futuresMarket = futuresMarketsByKey[_market];

    IFuturesMarket(futuresMarket).withdrawAllMargin();
  }

  /*****************************************************
   *  SYNTHETIX FUTURES HEDGING
   *****************************************************/

  /*****************************************************
   *  SYNTHETIX FUTURES HEDGING HELPER
   *****************************************************/

  /**
   * @dev checks delta for vault for a market
   */
  function _checkNetDelta(bytes32 _market) public view returns (int netDelta) {
    uint _len = activeStrikeTrades.length;

    uint[] memory positionIds = new uint[](_len);
    StrikeTrade memory strike;

    for (uint i = 0; i < _len; i++) {
      strike = activeStrikeTrades[i];

      positionIds[i] = strike.positionId;
    }

    ILyraBase.OptionPosition[] memory positions = lyra(_market).getPositions(positionIds);
    uint _positionsLen = positions.length;
    uint[] memory strikeIds = new uint[](_positionsLen);

    for (uint i = 0; i < _positionsLen; i++) {
      ILyraBase.OptionPosition memory position = positions[i];
      if (position.state == ILyraBase.PositionState.ACTIVE) {
        strikeIds[i] = positions[i].strikeId;
      }
    }

    int[] memory deltas = lyra(_market).getDeltas(strikeIds);

    for (uint i = 0; i < deltas.length; i++) {
      netDelta = netDelta + deltas[i];
    }
  }

  /**
   * @dev checks delta for position - used by keeper and user to hedge (shown on ui)
   */
  function _checkDeltaByPositionId(bytes32 _market, uint _positionId) external view returns (int delta) {
    StrikeTrade memory _strikeTrade = activeStrikeByPositionId[_positionId];
    require(_strikeTrade.strikeId > 0, 'No strike Id');
    int callDelta = lyra(_market).getDeltas(_toDynamic(_strikeTrade.strikeId))[0];
    // check direction
    delta = _isCall(_strikeTrade.optionType) ? callDelta : callDelta - SignedDecimalMath.UNIT;
  }

  /**
   * @notice gets allowed max leverage according to strategy
   * @dev calculates the position amount required to stay above the buffer collateral
   * @param _deltaToHedge position delta
   * @param _maxLeverageSize strategy max leverage
   * @param _marginRemaining remaining margin
   * @param _spotPrice spot price
   */
  function _maxLeverageSize(
    int _deltaToHedge,
    uint _maxLeverageSize,
    uint _marginRemaining,
    uint _spotPrice
  ) private pure returns (int size) {
    int direction = _deltaToHedge >= 0 ? int(1) : -int(1);
    size =
      direction *
      (int(_maxLeverageSize).multiplyDecimal(int(_marginRemaining))).divideDecimal(int(_spotPrice));
  }
}
