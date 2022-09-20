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
   * @notice Assigns all lyra contracts
   * @param _synthetixAdapter SynthetixAdapter address
   */
  constructor(address _synthetixAdapter) StrategyBase(_synthetixAdapter) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   * @param marketAddresses list of lyra & snx addresses
   * @param _currentStrategy vault strategy settings
   */
  function initialize(
    address _owner,
    address _vault,
    address[] memory marketAddresses,
    StrategyDetail memory _currentStrategy
  ) external {
    baseInitialize(_owner, _vault, marketAddresses, _currentStrategy);
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
  }

  /**
   * @notice one type of hedge strategy allowed
   * @param _hedgeType hedge type
   */
  function setHedgeStrategy(uint _hedgeType) external onlyOwner {
    hedgeType = HEDGETYPE(_hedgeType);
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
  }

  function getVaultStrategy() public view returns (StrategyDetail memory _strategyDetail) {
    return currentStrategy;
  }

  ///////////////////
  // VAULT ACTIONS //
  ///////////////////

  /**
   * @notice Set boardId for vault
   * @param boardId lyra board id
   */
  function setBoard(uint boardId) external onlyVault {
    Board memory board = getBoard(boardId);
    require(_isValidExpiry(board.expiry), "invalid board");
    activeExpiry = board.expiry;
    activeBoardId = boardId;
  }

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
      uint capitalUsed
    )
  {
    uint strikeId = _strike.strikeId;
    uint size = _strike.size;
    uint optionType = _strike.optionType;
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    require(validateTimeIntervalByOptionType(strikeId, optionType), "min time interval");
    require(_isValidVolVariance(strikeId, optionType), "vol variance exceeded");

    Strike memory strike = getStrikes(_toDynamic(strikeId))[0];

    require(isValidStrike(strike, optionType), "invalid strike");

    if (_isLong(currentStrikeStrategy.optionType)) {
      uint maxPremium = _getPremiumLimit(strike, false, _strike);
      (positionId, premium) = _buyStrike(strike, size, currentStrikeStrategy, maxPremium);
      capitalUsed = maxPremium;
    } else {
      (uint collateralToAdd, uint setCollateralTo) = getRequiredCollateral(strike, size, optionType);
      (positionId, premium) = _sellStrike(strike, size, setCollateralTo, currentStrikeStrategy, _strike);
      capitalUsed = collateralToAdd;
    }

    currentStrikeTrades.push(_strike);
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
    Strike memory strike,
    uint _size,
    uint _optionType
  ) public view returns (uint collateralToAdd, uint setCollateralTo) {
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
   * @notice perform the sell
   * @param strike strike detail
   * @param _size target size
   * @param setCollateralTo target collateral amount
   * @param currentStrikeStrategy strategy of strike's optiontype to trade
   * @param currentStrikeTrade details of striketrade
   * @return positionId lyra position id
   * @return totalCost the premium received from selling
   */
  function _sellStrike(
    Strike memory strike,
    uint _size,
    uint setCollateralTo,
    StrikeStrategyDetail memory currentStrikeStrategy,
    StrikeTrade memory currentStrikeTrade
  ) internal returns (uint, uint) {
    uint strategyIndex = activeStrikeIds.length;

    // get minimum expected premium based on minIv
    uint minExpectedPremium = _getPremiumLimit(strike, true, currentStrikeTrade);
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
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost >= minExpectedPremium, "premium received is below min expected premium");

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice perform the buy
   * @param strike strike detail
   * @param _size target size
   * @param currentStrikeStrategy strategy of strike's optiontype to trade
   * @param maxPremium total cost acceptable
   * @return positionId
   * @return totalCost
   */
  function _buyStrike(
    Strike memory strike,
    uint _size,
    StrikeStrategyDetail memory currentStrikeStrategy,
    uint maxPremium
  ) internal returns (uint, uint) {
    uint strategyIndex = activeStrikeIds.length;

    OptionType optionType = OptionType(currentStrikeStrategy.optionType);
    // perform trade to long
    TradeResult memory result = openPosition(
      TradeInputParameters({
        strikeId: strike.id,
        positionId: strikeToPositionId[strike.id],
        iterations: 1,
        optionType: optionType,
        amount: _size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: maxPremium,
        rewardRecipient: address(0) // set to zero address if don't want to wait for whitelist
      })
    );
    lastTradeTimestamp[strike.id] = block.timestamp;
    lastTradeOptionType[strike.id] = currentStrikeStrategy.optionType + 1;

    // update active strikes
    _addActiveStrike(strike.id, result.positionId, strategyIndex);

    require(result.totalCost <= maxPremium, "premium too high");

    return (result.positionId, result.totalCost);
  }

  /**
   * @notice reduce size of lyra options position
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   * @param positionId lyra position id
   * @param closeAmount amount closing
   */
  function reducePosition(uint positionId, uint closeAmount) external onlyVault {
    OptionPosition memory position = getPositions(_toDynamic(positionId))[0];
    Strike memory strike = getStrikes(_toDynamic(position.strikeId))[0];
    require(strikeToPositionId[position.strikeId] == positionId, "invalid positionId");

    // only allows closing if collat < minBuffer
    require(
      closeAmount <= getAllowedCloseAmount(position, strike.strikePrice, strike.expiry, uint(position.optionType)),
      "amount exceeds allowed close amount"
    );

    uint currentStrikeTradeIndex = strikeIdToTrade[position.strikeId];
    StrikeTrade memory currentStrikeTrade = currentStrikeTrades[currentStrikeTradeIndex];

    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(strike, false, currentStrikeTrade);
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
    OptionPosition memory position,
    uint strikePrice,
    uint strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint minCollatPerAmount = _getBufferCollateral(
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
  function _dynamicDeltaHedge(int deltaToHedge, uint hedgeAttempts) external onlyVault {
    require(hedgeType == HEDGETYPE.DYNAMIC_DELTA_HEDGE, "Not allowed");

    require(dynamicHedgeStrategy.maxHedgeAttempts <= hedgeAttempts);

    (uint marginRemaining, ) = futuresMarket.remainingMargin(address(this));

    require(marginRemaining > 0, "Remaining margin is 0");

    uint spotPrice = synthetixAdapter.getSpotPriceForMarket(address(optionMarket));
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
  function _staticDeltaHedge(int deltaToHedge) external onlyVault {
    require(hedgeType == HEDGETYPE.STATIC_DELTA_HEDGE, "Not allowed");

    (uint marginRemaining, ) = futuresMarket.remainingMargin(address(this));

    require(marginRemaining > 0, "Remaining margin is 0");

    uint spotPrice = synthetixAdapter.getSpotPriceForMarket(address(optionMarket));
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

  function _checkNetDelta() public view returns (int netDelta) {
    uint _len = activeStrikeIds.length;
    uint[] memory positionIds = new uint[](_len);

    for (uint i = 0; i < _len; i++) {
      uint strikeId = activeStrikeIds[i];
      uint positionId = strikeToPositionId[strikeId];
      positionIds[i] = positionId;
    }

    OptionPosition[] memory positions = getPositions(positionIds);
    uint _positionsLen = positions.length;
    uint[] memory strikeIds = new uint[](_positionsLen);

    for (uint i = 0; i < _positionsLen; i++) {
      strikeIds[i] = positions[i].strikeId;
    }

    int[] memory deltas = getDeltas(strikeIds);

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
