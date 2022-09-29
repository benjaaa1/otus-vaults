//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;
pragma experimental ABIEncoderV2;

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

// Libraries
import "../../synthetix/SignedSafeDecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";

// interfaces
import "../../interfaces/ILyraBase.sol";

// Vault
import {Vault} from "../../libraries/Vault.sol";
import {OtusVault} from "../OtusVault.sol";
import {StrategyBase} from "./StrategyBase.sol";

/**
 * @title Strategy
 * @author Lyra
 * @dev Executes strategy for vault based on settings - supports multiple forms of hedges
 */
contract Strategy is StrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  address public vault;
  OtusVault public otusVault;

  /************************************************
   *  EVENTS
   ***********************************************/

  event HedgeClosePosition(address closer, uint spotPrice, uint strikeId);

  event Hedge(HEDGETYPE _hedgeType, int size, uint spotPrice, uint strikeId);

  /************************************************
   *  Modifiers
   ***********************************************/

  modifier onlyVault() {
    require(msg.sender == vault, "NOT_VAULT");
    _;
  }

  /************************************************
   *  ADMIN
   ***********************************************/

  /**
   * @notice
   */
  constructor(address _quoteAsset, address _futuresMarket) StrategyBase(_quoteAsset, _futuresMarket) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   * @param _currentStrategy vault strategy settings
   */
  function initialize(
    bytes32[] memory lyraAdapterKeys,
    address[] memory lyraAdapterValues,
    address[] memory lyraOptionMarkets,
    address _owner,
    address _vault,
    StrategyDetail memory _currentStrategy
  ) external {
    baseInitialize(lyraAdapterKeys, lyraAdapterValues, lyraOptionMarkets, _owner, _vault, _currentStrategy);
    vault = _vault;
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
    require(!roundInProgress, "round opened");
    currentStrategy = _currentStrategy;
    // event StrategyUpdated(address vault, StrategyDetail updatedStrategy);
    // emit StrategyUpdated(vault, currentStrategy);
  }

  /**
   * @notice one type of hedge strategy allowed
   * @param _hedgeType hedge type
   */
  function setHedgeStrategyType(uint _hedgeType) external onlyOwner {
    hedgeType = HEDGETYPE(_hedgeType);
    // event StrategyHedgeTypeUpdated(address vault, HEDGETYPE hedgeType);
    // emit StrategyHedgeTypeUpdated(vault, hedgeType);
  }

  /**
   * @notice Update the strike hedge strategy
   * @param _staticStrategy vault strategy settings
   * @param _dynamicStrategy vault strategy settings
   * @dev should be able to accept multiple strategy types (1 click / delta / auto simple)
   */
  function setHedgeStrategies(
    StaticDeltaHedgeStrategy memory _staticStrategy,
    DynamicDeltaHedgeStrategy memory _dynamicStrategy
  ) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, "round opened");

    staticHedgeStrategy = _staticStrategy;
    dynamicHedgeStrategy = _dynamicStrategy;
    // event HedgeStrategyUpdated(address vault, HEDGETYPE hedgeType);
    // emit HedgeStrategyUpdated(vault, hedgeType);
  }

  /**
   * @notice Update the strike strategy by option
   * @param _currentStrikeStrategies different strike strategies for each option type supported
   */
  function setStrikeStrategyDetail(StrikeStrategyDetail[] memory _currentStrikeStrategies) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = OtusVault(vault).vaultState();
    require(!roundInProgress, "round opened");

    uint len = _currentStrikeStrategies.length;
    StrikeStrategyDetail memory currentStrikeStrategy;

    for (uint i = 0; i < len; i++) {
      currentStrikeStrategy = _currentStrikeStrategies[i];
      currentStrikeStrategies[currentStrikeStrategy.optionType] = currentStrikeStrategy;
    }
    // event StrikeStrategyUpdated(address vault, StrikeStrategyDetail[] currentStrikeStrategies);
    // emit StrikeStrategyUpdated(vault, currentStrikeStrategies);
  }

  function getVaultStrategy() public view returns (StrategyDetail memory _strategyDetail) {
    return currentStrategy;
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @notice Sell or buy options from vault
   * @dev sell a fix aomunt of options and collect premium or buy a fix amount and pay the price
   * @param _strike lyra strike details to trade
   * @return positionId
   * @return premium
   * @return capitalUsed
   */
  function doTrade(StrikeTrade memory _strike)
    external
    onlyVault
    returns (
      uint positionId,
      uint premium,
      uint capitalUsed,
      uint expiry
    )
  {
    address lyraBase = lyraBases[_strike.market];

    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[_strike.optionType];

    require(_isValidVolVariance(lyraBase, _strike.strikeId, _strike.optionType), "vol variance exceeded");

    // check if valid market for trade here cuz it's part of strategy
    ILyraBase.Strike memory strike = ILyraBase(lyraBase).getStrikes(_toDynamic(_strike.strikeId))[0];
    require(isValidStrike(lyraBase, strike, _strike.optionType), "invalid strike");

    expiry = strike.expiry;

    if (_isLong(currentStrikeStrategy.optionType)) {
      uint maxPremium = _getPremiumLimit(lyraBase, strike, false, _strike);
      (positionId, premium) = _buyStrike(_strike.market, strike, _strike.size, _strike.optionType, maxPremium);
      capitalUsed = maxPremium;
    } else {
      (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(
        lyraBase,
        strike,
        _strike.size,
        _strike.optionType
      );
      uint minExpectedPremium = _getPremiumLimit(lyraBase, strike, true, _strike);
      (positionId, premium) = _sellStrike(
        _strike.market,
        strike,
        _strike.size,
        setCollateralTo,
        _strike.optionType,
        minExpectedPremium
      );
      capitalUsed = collateralToAdd;
    }

    _strike.positionId = positionId;
    // _addActiveStrike(_strike, positionId, _strike.optionType);
    activeStrikeTrades.push(_strike);
  }

  /**
   * @notice Return funds to vault and clera strikes
   * @dev convert premium in quote asset into collateral asset and send it back to the vault.
   */
  function returnFundsAndClearStrikes() external onlyVault {
    // need to return the synthetix ones too
    _closeHedgeEndOfRound();

    uint quoteBal = quoteAsset.balanceOf(address(this));

    require(quoteAsset.transfer(address(vault), quoteBal), "failed to return funds from strategy");

    _clearAllActiveStrikes();
  }

  /**
   * @notice Return funds to vault and clera strikes
   * @dev calculate required collateral to add in the next trade.
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   * @param strike strike to trade
   * @param _size expected size
   * @param _optionType optiontype of trade
   * @return collateralToAdd
   * @return setCollateralTo
   */
  function getRequiredCollateral(
    address lyraBase,
    ILyraBase.Strike memory strike,
    uint _size,
    uint _optionType
  ) public view returns (uint collateralToAdd, uint setCollateralTo) {
    uint sellAmount = _size;
    ILyraBase.ExchangeRateParams memory exchangeParams = ILyraBase(lyraBase).getExchangeParams();

    // get existing position info if active
    uint existingAmount;
    uint existingCollateral;

    if (_isActiveStrike(strike.id, _optionType)) {
      uint positionId = positionIdByStrikeOption[keccak256(abi.encode(strike.id, _optionType))];
      ILyraBase.OptionPosition memory position = ILyraBase(lyraBase).getPositions(_toDynamic(positionId))[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }

    // gets minBufferCollat for the whole position
    uint minBufferCollateral = _getBufferCollateral(
      lyraBase,
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
   * @notice perform the sell
   * @param strike strike detail
   * @param _size target size
   * @param setCollateralTo target collateral amount
   * @param _optionType strikes optionType
   * @param minExpectedPremium minExpectedPremium
   * @return positionId lyra position id
   * @return totalCost the premium received from selling
   */
  function _sellStrike(
    bytes32 market,
    ILyraBase.Strike memory strike,
    uint _size,
    uint setCollateralTo,
    uint _optionType,
    uint minExpectedPremium
  ) internal returns (uint, uint) {
    // get minimum expected premium based on minIv
    OptionType optionType = OptionType(_optionType);
    // perform trade

    // needs to be delegated - not delegated move openPosition to strategybase or another adapter
    TradeResult memory result = openPosition(
      market,
      TradeInputParameters({
        strikeId: strike.id,
        positionId: positionIdByStrikeOption[keccak256(abi.encode(strike.id, _optionType))], // need to get track by strike id and option type
        iterations: 1,
        optionType: optionType,
        amount: _size, // size should be different depending on strategy
        setCollateralTo: setCollateralTo,
        minTotalCost: minExpectedPremium,
        maxTotalCost: type(uint).max,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice perform the buy
   * @param strike strike detail
   * @param _size target size
   * @param _optionType strikes optionType
   * @param maxPremium total cost acceptable
   * @return positionId
   * @return totalCost
   */
  function _buyStrike(
    bytes32 market,
    ILyraBase.Strike memory strike,
    uint _size,
    uint _optionType,
    uint maxPremium
  ) internal returns (uint, uint) {
    OptionType optionType = OptionType(_optionType);
    // perform trade to long
    // needs to be delegated - not delegated move openPosition to strategybase or another adapter along with other state changers
    TradeResult memory result = openPosition(
      market,
      TradeInputParameters({
        strikeId: strike.id,
        positionId: positionIdByStrikeOption[keccak256(abi.encode(strike.id, _optionType))],
        iterations: 1,
        optionType: optionType,
        amount: _size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: maxPremium,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );

    require(result.totalCost <= maxPremium, "premium too high");

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice reduce size of lyra options position
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   * @param positionId lyra position id
   * @param closeAmount amount closing
   */
  function reducePosition(
    bytes32 market,
    uint positionId,
    uint closeAmount
  ) external onlyVault {
    address lyraBase = lyraBases[market];
    ILyraBase.OptionPosition memory position = ILyraBase(lyraBase).getPositions(_toDynamic(positionId))[0];
    ILyraBase.Strike memory strike = ILyraBase(lyraBase).getStrikes(_toDynamic(position.strikeId))[0];

    require(
      positionIdByStrikeOption[keccak256(abi.encode(position.strikeId, position.optionType))] == positionId,
      "invalid positionId"
    );

    // only allows closing if collat < minBuffer
    require(
      closeAmount <=
        getAllowedCloseAmount(market, position, strike.strikePrice, strike.expiry, uint(position.optionType)),
      "amount exceeds allowed close amount"
    );

    StrikeTrade memory currentStrikeTrade = activeStrikeByPositionId[positionId];

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(lyraBase, strike, false, currentStrikeTrade);
    TradeInputParameters memory tradeParams = TradeInputParameters({
      strikeId: position.strikeId,
      positionId: position.positionId,
      iterations: 3,
      optionType: OptionType(uint(position.optionType)), // convert to lyraadapter optiontype
      amount: closeAmount,
      setCollateralTo: position.collateral,
      minTotalCost: type(uint).min,
      maxTotalCost: maxExpectedPremium,
      rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
    });

    // needs to be delegated - not delegated move openPosition to strategybase or another adapter along with other state changers
    TradeResult memory result;
    if (!_isOutsideDeltaCutoff(lyraBase, strike.id)) {
      result = closePosition(market, tradeParams);
    } else {
      // will pay less competitive price to close position
      result = forceClosePosition(market, tradeParams);
    }

    require(result.totalCost <= maxExpectedPremium, "premium paid is above max expected premium");

    // return closed collateral amount
    // quote collateral
    quoteAsset.transfer(address(vault), closeAmount);
  }

  /**
   * @notice get allowed close amount
   * @dev calculates the position amount required to stay above the buffer collateral
   * @param position lyra position id
   * @param strikePrice strike price
   * @param strikeExpiry strike expiry
   * @param _optionType option type
   */
  function getAllowedCloseAmount(
    bytes32 market,
    ILyraBase.OptionPosition memory position,
    uint strikePrice,
    uint strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    address lyraBase = lyraBases[market];
    ILyraBase.ExchangeRateParams memory exchangeParams = ILyraBase(lyraBase).getExchangeParams();
    uint minCollatPerAmount = _getBufferCollateral(
      lyraBase,
      strikePrice,
      strikeExpiry,
      exchangeParams.spotPrice,
      1e18,
      _optionType
    );

    closeAmount = position.collateral < minCollatPerAmount.multiplyDecimal(position.amount)
      ? position.amount - position.collateral.divideDecimal(minCollatPerAmount)
      : 0;
  }

  /******************************************************
   * HEDGE WITH SYNTHETIX FUTURES
   *****************************************************/

  /**
   * @notice transfer to synthetix futures market
   * @param hedgeFunds funds to transfer
   * @dev refactor this to move away from futuresadapter
   */
  function transferToFuturesMarket(int hedgeFunds) public {
    futuresMarket.transferMargin(hedgeFunds);
  }

  /*****************************************************
   *  DYNAMIC HEDGE - KEEPER
   *****************************************************/

  /**
   * @notice delta hedging using synthetix futures based on strategy
   * @param deltaToHedge deltaToHedge calcualted by keeper
   * @param hedgeAttempts attempts
   * @dev refactor this to move away from futuresadapter
   */
  function _dynamicDeltaHedge(
    bytes32 market,
    int deltaToHedge,
    uint hedgeAttempts
  ) external onlyVault {
    require(hedgeType == HEDGETYPE.DYNAMIC_DELTA_HEDGE, "Not allowed");

    require(dynamicHedgeStrategy.maxHedgeAttempts <= hedgeAttempts);

    (uint marginRemaining, ) = futuresMarket.remainingMargin(address(this));

    require(marginRemaining > 0, "Remaining margin is 0");

    address lyraBase = lyraBases[market];

    uint spotPrice = ILyraBase(lyraBase).getSpotPriceForMarket();
    uint fundsRequiredSUSD = _abs(deltaToHedge).multiplyDecimal(spotPrice); // 20 * 2000 = 40000

    // marginRemaining = 44000 | marginRemaining / fundsRequired = 1.1x == 110%
    // marginRemaining = 24000 | marginRemaining / fundsRequired = .6x == 60%
    uint currentLeverage = marginRemaining.divideDecimal(fundsRequiredSUSD);

    // need to calculate max size possible by taking into account max leverage allowed
    // deltaToHedge is +10 == buy 10 units = $20k current marginRemaining = $10k // 20k / 10k = 2x leverage / maxlevarge is 150% * marginRemaining / 10k * 1.5x = 15k / spotprice (2k) = 7.5
    // deltaToHedge is -10 == sell 10 units = $20k
    int size = staticHedgeStrategy.maxLeverageSize > currentLeverage
      ? deltaToHedge
      : _maxLeverageSize(deltaToHedge, staticHedgeStrategy.maxLeverageSize, marginRemaining, spotPrice);

    futuresMarket.modifyPosition(size);
  }

  /******************************************************
   *  STATIC HEDGE - DELTA HEDGE
   *****************************************************/

  /**
   * @notice static delta hedging using synthetix futures based on strategy
   * @param deltaToHedge set by user
   * @dev refactor this to move away from futuresadapter
   */
  function _staticDeltaHedge(bytes32 market, int deltaToHedge) external onlyVault {
    require(hedgeType == HEDGETYPE.STATIC_DELTA_HEDGE, "Not allowed");

    (uint marginRemaining, ) = futuresMarket.remainingMargin(address(this));

    require(marginRemaining > 0, "Remaining margin is 0");

    address lyraBase = lyraBases[market];

    uint spotPrice = ILyraBase(lyraBase).getSpotPriceForMarket();
    uint fundsRequiredSUSD = _abs(deltaToHedge).multiplyDecimal(spotPrice); // 20 * 2000 = 40000

    // marginRemaining = 44000 | marginRemaining / fundsRequired = 1.1x == 110%
    // marginRemaining = 24000 | marginRemaining / fundsRequired = .6x == 60%
    uint currentLeverage = marginRemaining.divideDecimal(fundsRequiredSUSD);

    // need to calculate max size possible by taking into account max leverage allowed
    // deltaToHedge is +10 == buy 10 units = $20k current marginRemaining = $10k // 20k / 10k = 2x leverage / maxlevarge is 150% * marginRemaining / 10k * 1.5x = 15k / spotprice (2k) = 7.5
    // deltaToHedge is -10 == sell 10 units = $20k
    int size = staticHedgeStrategy.maxLeverageSize > currentLeverage
      ? deltaToHedge
      : _maxLeverageSize(deltaToHedge, staticHedgeStrategy.maxLeverageSize, marginRemaining, spotPrice);

    futuresMarket.modifyPosition(size);
  }

  /*****************************************************
   *  DELTA HEDGE -  CONTROLLED BY USER
   *****************************************************/

  /**
   * @notice one click delta hedge
   * @param size total size of hedge
   */
  function _simpleHedge(int size) external onlyVault {
    require(hedgeType == HEDGETYPE.SIMPLE_HEDGE, "Not allowed");

    (uint marginRemaining, ) = futuresMarket.remainingMargin(address(this));
    require(marginRemaining > 0, "Remaining margin is 0");

    futuresMarket.modifyPosition(size);
  }

  /*****************************************************
   *  CLOSE HEDGE
   *****************************************************/

  /**
   * @notice close position
   * @dev refactor this to move away from futuresadapter
   */
  function _closeHedge() external onlyVault {
    futuresMarket.closePosition();
  }

  /**
   * @notice withdraw margin
   * @dev refactor this to move away from futuresadapter
   */
  function _closeHedgeEndOfRound() public {
    futuresMarket.withdrawAllMargin();
  }

  /*****************************************************
   *  SYNTHETIX FUTURES HEDGING
   *****************************************************/

  /*****************************************************
   *  SYNTHETIX FUTURES HEDGING HELPER
   *****************************************************/

  function _checkNetDelta(bytes32 market) public view returns (int netDelta) {
    address lyraBase = lyraBases[market];
    uint _len = activeStrikeTrades.length;

    uint[] memory positionIds = new uint[](_len);
    StrikeTrade memory strike;

    for (uint i = 0; i < _len; i++) {
      strike = activeStrikeTrades[i];
      positionIds[i] = strike.positionId;
    }

    ILyraBase.OptionPosition[] memory positions = ILyraBase(lyraBase).getPositions(positionIds);
    uint _positionsLen = positions.length;
    uint[] memory strikeIds = new uint[](_positionsLen);

    for (uint i = 0; i < _positionsLen; i++) {
      ILyraBase.OptionPosition memory position = positions[i];
      if (position.state == ILyraBase.PositionState.ACTIVE) {
        strikeIds[i] = positions[i].strikeId;
      }
    }

    int[] memory deltas = ILyraBase(lyraBase).getDeltas(strikeIds);

    for (uint i = 0; i < deltas.length; i++) {
      netDelta = netDelta + deltas[i];
    }
  }

  function _maxLeverageSize(
    int deltaToHedge,
    uint maxLeverageSize,
    uint marginRemaining,
    uint spotPrice
  ) private pure returns (int size) {
    int direction = deltaToHedge >= 0 ? int(1) : -int(1);
    size = direction * (int(maxLeverageSize).multiplyDecimal(int(marginRemaining))).divideDecimal(int(spotPrice));
  }
}
