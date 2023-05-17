//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
pragma experimental ABIEncoderV2;

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/ILyraBase.sol";
import "../../interfaces/synthetix/IFuturesMarket.sol";
import "../../interfaces/gelato/IOps.sol";

// Libraries
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import {Vault} from "../../libraries/Vault.sol";
import "../../synthetix/SignedSafeDecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";

// Vault
import {OtusVault} from "../OtusVault.sol";

// Inherited
import {LyraAdapter} from "./LyraAdapter.sol";
import {StrategyBase} from "../base/StrategyBase.sol";

/**
 * @title Strategy - Options
 * @author Lyra
 * @dev Executes strategy for vault based on settings with hedge support
 */
contract Strategy is LyraAdapter, StrategyBase {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  struct StrikeTradeOrder {
    StrikeTrade strikeTrade;
    bytes32 gelatoTaskId;
  }

  /************************************************
   *  EVENTS
   ***********************************************/
  event Trade(
    address indexed _strategy,
    StrikeTrade strikeTrade,
    uint premium,
    uint expiry,
    uint round
  );

  event StrikeOrderPlaced(address indexed _strategy, StrikeTrade strikeTrade, uint orderId);

  event OrderCancelled(address indexed _strategy, uint _orderId);

  event PositionReduced(uint positionId, uint amount);

  event StrikeStrategyUpdated(address vault, StrikeStrategyDetail[] currentStrikeStrategies);

  event StrategyUpdated(address vault, StrategyDetail updatedStrategy);

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

  /// @notice cannot execute invalid order
  error OrderInvalid();

  /************************************************
   *  STATE
   ***********************************************/

  mapping(uint256 => StrikeTradeOrder) public orders;

  uint256 public orderId;

  /************************************************
   *  ADMIN
   ***********************************************/

  /**
   * @notice set quote asset and controller
   * @param _quoteAsset usd
   * @param _otusController otus controller
   */
  constructor(
    address _quoteAsset,
    address _otusController
  ) LyraAdapter(_quoteAsset) StrategyBase(_otusController) {}

  /**
   * @notice Initializer strategy
   * @param _owner owner of strategy
   * @param _vault vault that owns strategy
   */
  function initialize(address _owner, address _vault) external {
    (
      bytes32[] memory _markets,
      address[] memory _lyraBases,
      address[] memory _lyraOptionMarkets
    ) = otusController._getOptionsContracts();

    lyraInitialize(_markets, _lyraBases, _lyraOptionMarkets);
    baseInitialize(_owner, _vault);
  }

  /************************************************
   *  FUTURES SETTERS
   ***********************************************/

  /// @dev should be only otus controller
  /// @notice sets futures perps market address
  function setSynthetixAddresses(bytes32 key, address _futuresMarket) external onlyController {
    futuresMarketsByKey[key] = IFuturesMarket(_futuresMarket);
    // set futures market settings
  }

  /// @dev should be only otus controller
  function setGMXAddresses() external onlyController {
    // futuresMarketsByKey[key] = IFuturesMarket(futuresMarket);
    // set futures market settings
  }

  /************************************************
   *  STRATEGY SETTERS
   ***********************************************/
  error RoundInProgress();

  /**
   * @notice Update the strategy for the new round
   * @param _currentStrategy vault strategy settings
   */
  function setStrategy(StrategyDetail memory _currentStrategy) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = otusVault.vaultState();
    // require(!roundInProgress, "round opened");
    if (roundInProgress) {
      revert RoundInProgress();
    }
    currentStrategy = _currentStrategy;

    // after strategy is set need to update allowed markets :
    _setAllowedMarkets(currentStrategy.allowedMarkets);
    _setOptionMarkets(currentStrategy.allowedMarkets);
    emit StrategyUpdated(address(otusVault), currentStrategy);
  }

  /**
   * @notice one type of hedge strategy allowed
   * @param _hedgeType hedge type
   */
  function setHedgeStrategyType(uint _hedgeType) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = otusVault.vaultState();
    // require(!roundInProgress, "round opened");
    if (roundInProgress) {
      revert RoundInProgress();
    }
    hedgeType = HEDGETYPE(_hedgeType);
    emit StrategyHedgeTypeUpdated(address(otusVault), hedgeType);
  }

  /**
   * @notice Update the strike strategy by option
   * @param _currentStrikeStrategies different strike strategies for each option type supported
   */
  function setStrikeStrategyDetail(
    StrikeStrategyDetail[] memory _currentStrikeStrategies
  ) external onlyOwner {
    (, , , , , , , bool roundInProgress, ) = otusVault.vaultState();
    // require(!roundInProgress, "round opened");
    if (roundInProgress) {
      revert RoundInProgress();
    }

    uint len = _currentStrikeStrategies.length;
    StrikeStrategyDetail memory currentStrikeStrategy;

    for (uint i = 0; i < len; i++) {
      currentStrikeStrategy = _currentStrikeStrategies[i];
      currentStrikeStrategies[currentStrikeStrategy.optionType] = currentStrikeStrategy;
    }

    emit StrikeStrategyUpdated(address(otusVault), _currentStrikeStrategies);
  }

  /**
   * @dev On init and strategy update / update markets allowed
   */
  function _setOptionMarkets(bytes32[] memory managerAllowedMarkets) internal {
    uint len = managerAllowedMarkets.length;

    for (uint i = 0; i < len; i++) {
      bytes32 key = managerAllowedMarkets[i];
      allowedMarkets[key] = true;
      // allowedOptionMarket[key] = true;

      address optionMarket = lyraOptionMarkets[key];
      IFuturesMarket futuresMarket = futuresMarketsByKey[key];

      quoteAsset.approve(address(optionMarket), type(uint).max);
      quoteAsset.approve(address(futuresMarket), type(uint).max);
    }
  }

  /******************************************************
   * VAULT ACTIONS
   *****************************************************/
  /**
   * @notice Execute Trade/Investment
   * @param data bytes encoded longTrade and shortTrade
   */
  function trade(
    bytes calldata data,
    uint _round
  ) external onlyVault returns (uint allCapitalUsed) {
    (StrikeTrade[] memory _longTrades, StrikeTrade[] memory _shortTrades) = abi.decode(
      data,
      (StrikeTrade[], StrikeTrade[])
    );

    uint positionId;
    uint premium;
    uint capitalUsed;
    uint expiry;
    uint strikePrice;

    uint longTradesLen = _longTrades.length;
    uint shortTradesLen = _shortTrades.length;

    for (uint i = 0; i < shortTradesLen; i++) {
      StrikeTrade memory shortTrade = _shortTrades[i];
      // if market execute if limit order placeOrder for keeper
      if (shortTrade.orderType == OrderTypes.LIMIT) {
        // committed margin - capitalUsed
        capitalUsed = _placeOrder(shortTrade);
      } else {
        (positionId, premium, capitalUsed, expiry, strikePrice) = _executeTrade(shortTrade);
        // emit Trade(address(this), shortTrade, premium, expiry, _round);
      }
      allCapitalUsed += capitalUsed;
    }

    for (uint i = 0; i < longTradesLen; i++) {
      StrikeTrade memory longTrade = _longTrades[i];

      if (longTrade.orderType == OrderTypes.LIMIT) {
        // committed margin - capitalUsed
        capitalUsed = _placeOrder(longTrade);
      } else {
        (positionId, premium, capitalUsed, expiry, strikePrice) = _executeTrade(longTrade);
        // emit Trade(address(this), longTrade, premium, expiry, _round);
      }

      allCapitalUsed += capitalUsed;

      // emit Trade(address(this), longTrade, premium, expiry, _round);
    }
  }

  /**
   * @notice Execute Trade/Investment
   */
  function close() external onlyVault {
    uint quoteBal = quoteAsset.balanceOf(address(this));
    _trasferFundsToVault(quoteBal);
    // need to settle positions in lyra if not settled by lyra
    _closePositions();
    _clearRoundStrikes();

    // _returnFundsAndClearStrikes()
    // _clearRoundStrikes

    // need to close future positions used for hedging _closePositions()
    // _closeHedges()
    // -- clearHedgeTracking()

    // how should hedging be tracked?
    // usershedge
    // only 1 open hedge allowed / market

    // dynamic hedge
    // only 1 open hedge allowed / market
  }

  /**
   * @notice reduce size of lyra options position
   * @dev use premium in strategy to reduce position size if collateral ratio is out of range
   * @param _market btc/eth
   * @param _positionId lyra position id
   * @param _closeAmount amount closing
   */
  function reducePosition(bytes32 _market, uint _positionId, uint _closeAmount) external onlyVault {
    ILyraBase.OptionPosition memory position = lyraBase(_market).getPositions(
      _toDynamic(_positionId)
    )[0];
    ILyraBase.Strike memory strike = lyraBase(_market).getStrikes(_toDynamic(position.strikeId))[0];

    (bool _isActive, ) = _isActiveStrike(_positionId);

    if (!_isActive) {
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

    // @dev this should be storage
    StrikeTrade memory currentTrade = tradeByPositionId[_positionId];

    bool isMin = _isLong(currentTrade.optionType) ? false : true;
    // closes excess position with premium balance
    uint maxExpectedPremium = _getPremiumLimit(
      currentTrade,
      strike.expiry,
      strike.strikePrice,
      isMin
    );
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
    bool outsideDeltaCutoff = lyraBase(_market)._isOutsideDeltaCutoff(strike.id);
    if (!outsideDeltaCutoff) {
      result = closePosition(_market, tradeParams);
    } else {
      // will pay less competitive price to close position
      result = forceClosePosition(_market, tradeParams);
    }

    if (result.totalCost <= maxExpectedPremium) {
      revert PremiumAboveExpected(result.totalCost, maxExpectedPremium);
    }

    // return closed collateral amount
    _trasferFundsToVault(_closeAmount);

    emit PositionReduced(_positionId, _closeAmount);
  }

  /******************************************************
   * INTERNAL HELPERS
   *****************************************************/

  /**
   * @notice Sell or buy options from vault
   * @dev sell a fix aomunt of options and collect premium or buy a fix amount and pay the price
   * @param _trade lyra strike details to trade
   * @return positionId
   * @return premium
   * @return capitalUsed
   */
  function _executeTrade(
    StrikeTrade memory _trade
  )
    internal
    returns (uint positionId, uint premium, uint capitalUsed, uint expiry, uint strikePrice)
  {
    /// @notice check if market is allowed
    if (allowedMarkets[_trade.market] == false) {
      revert MarketNotAllowed(_trade.market);
    }

    (bool _isValid, ILyraBase.Strike memory strike) = _getValidStrike(_trade);

    if (!_isValid) {
      revert InvalidStrike(_trade.strikeId, _trade.market);
    }

    bool isLong = _isLong(_trade.optionType);
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

    // add to know which ones need to be closed
    // to have more details when reducing
    // strike ids are similar across option types
    // across markets?
    _addActiveTrade(_trade, positionId);

    expiry = strike.expiry;
    strikePrice = strike.strikePrice;
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
    OptionType optionType = OptionType(_trade.optionType);

    // perform trade
    TradeResult memory result = openPosition(
      _trade.market,
      TradeInputParameters({
        strikeId: _trade.strikeId,
        // send existing positionid or 0 if new
        positionId: _trade.positionId,
        iterations: 1,
        optionType: optionType,
        amount: _trade.size,
        setCollateralTo: _setCollateralTo,
        minTotalCost: _minExpectedPremium,
        maxTotalCost: type(uint).max,
        // set to zero address if don't want to wait for whitelist
        rewardRecipient: address(0)
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
        // send existing positionid or 0 if new
        positionId: _trade.positionId,
        iterations: 1,
        optionType: optionType,
        amount: _trade.size,
        setCollateralTo: 0,
        minTotalCost: 0,
        maxTotalCost: _maxPremium,
        // set to zero address if don't want to wait for whitelist
        rewardRecipient: address(0)
      })
    );

    if (result.totalCost > _maxPremium) {
      revert PremiumAboveExpected(result.totalCost, _maxPremium);
    }

    return (result.positionId, result.totalCost);
  }

  /******************************************************
   * LIMIT ORDER / KEEPER
   *****************************************************/

  /**
   * @notice place order in gelato keeper
   * @param _trade strike trade info
   * @return capitalUsed used to update vault state
   */
  function _placeOrder(StrikeTrade memory _trade) internal returns (uint capitalUsed) {
    // check there is ether
    if (address(this).balance < 1 ether / 100) {
      revert InsufficientEthBalance(address(this).balance, 1 ether / 100);
    }

    // committed margin is capital used
    // (size * premium if isBuy)
    // (size * collateral if sell)
    bool isLong = _isLong(_trade.optionType);

    (, ILyraBase.Strike memory strike) = _getValidStrike(_trade);

    if (isLong) {
      // targetprice replaces premium for buy
      capitalUsed = _trade.size.multiplyDecimal(_trade.targetPrice);
    } else {
      // getRequiredCollateral for both of these is best
      (uint collateralToAdd, ) = getRequiredCollateral(_trade, strike.strikePrice, strike.expiry);

      capitalUsed = collateralToAdd;
    }

    _trasferFromVault(capitalUsed);

    // createTaskNoPrepayment
    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this), // execution function address
      this.executeOrder.selector, // execution function selector
      address(this), // checker (resolver) address
      abi.encodeWithSelector(this.checker.selector, orderId), // checker (resolver) calldata
      ETH // payment token
    );

    // create order and order id
    orders[orderId] = StrikeTradeOrder({strikeTrade: _trade, gelatoTaskId: taskId});

    emit StrikeOrderPlaced(address(this), _trade, orderId);

    orderId++;
  }

  /**
   * @notice check if limit order is valid and execute
   * @param _orderId trade order id
   * @return canExec
   * @return execPayload
   */
  function checker(
    uint256 _orderId
  ) external view returns (bool canExec, bytes memory execPayload) {
    (canExec, ) = validOrder(_orderId);
    execPayload = abi.encodeWithSelector(this.executeOrder.selector, _orderId);
  }

  /**
   * @notice cancel order
   * @param _orderId trade order id
   */
  function cancelOrder(uint256 _orderId) external onlyOwner {
    StrikeTradeOrder memory order = orders[_orderId];
    IOps(ops).cancelTask(order.gelatoTaskId);
    // delete order from orders
    delete orders[_orderId];
    emit OrderCancelled(address(this), _orderId);
  }

  /**
   * @notice execute order
   * @param _orderId trade order id
   */
  function executeOrder(uint256 _orderId) external onlyOps {
    (bool isValidOrder, uint256 premiumLimit) = validOrder(_orderId);

    if (!isValidOrder) {
      revert OrderInvalid();
    }

    StrikeTradeOrder memory order = orders[_orderId];

    StrikeTrade memory strikeTrade = order.strikeTrade;

    bool isLong = _isLong(strikeTrade.optionType);
    uint positionId;
    uint premium;

    (bool _isValid, ILyraBase.Strike memory strike) = _getValidStrike(strikeTrade);

    if (!_isValid) {
      revert InvalidStrike(strikeTrade.strikeId, strikeTrade.market);
    }

    // execute trades
    if (isLong) {
      (positionId, premium) = buyStrike(strikeTrade, premiumLimit);
    } else {
      (, uint setCollateralTo) = getRequiredCollateral(
        strikeTrade,
        strike.strikePrice,
        strike.expiry
      );

      (positionId, premium) = sellStrike(strikeTrade, setCollateralTo, premiumLimit);
    }

    // remove from committed margin
    _addActiveTrade(strikeTrade, positionId);

    // remove task from gelato's side
    /// @dev optimization done for gelato
    IOps(ops).cancelTask(order.gelatoTaskId);

    delete orders[_orderId];

    (uint256 fee, address feeToken) = IOps(ops).getFeeDetails();
    _transfer(fee, feeToken);

    emit OrderFilled(address(this), _orderId, premium, fee);
  }

  /**
   * @notice check validity of orderid
   * @param _orderId trade order id
   * @return valid
   * @return premium
   */
  function validOrder(uint256 _orderId) public view returns (bool, uint) {
    // get order info
    StrikeTradeOrder memory order = orders[_orderId];

    StrikeTrade memory _trade = order.strikeTrade;

    (, ILyraBase.Strike memory strike) = _getValidStrike(_trade);

    bool isLong = _isLong(_trade.optionType);
    bool isMin = isLong ? false : true;

    // depending on type
    // _getPremiumLimit from lyra
    uint premiumLimit = _getPremiumLimit(_trade, strike.expiry, strike.strikePrice, isMin);

    if (isLong) {
      if (_trade.targetPrice > premiumLimit) {
        return (false, 0);
      } else {
        return (true, premiumLimit);
      }
    } else {
      if (_trade.targetPrice < premiumLimit) {
        return (false, 0);
      } else {
        return (true, premiumLimit);
      }
    }
  }

  error HedgeTypeNotAllowed(HEDGETYPE _hedgeType);

  /******************************************************
   * USER HEDGES
   ************************
   *****************************************************/

  /// @dev PARAMS WILL NEED TO BE DECODED
  function openUserHedge(bytes calldata data) external onlyVault {
    // require(hedgeType == HEDGETYPE.USER_HEDGE, "Not allowed");
    if (hedgeType != HEDGETYPE.USER_HEDGE) {
      revert HedgeTypeNotAllowed(hedgeType);
    }
    (bytes32 _market, int _hedgeSize) = abi.decode(data, (bytes32, int));

    _openUserHedge(_market, _hedgeSize);
  }

  /// @dev PARAMS WILL NEED TO BE DECODED
  function closeUserHedge(bytes calldata data) external onlyVault {
    if (hedgeType != HEDGETYPE.USER_HEDGE) {
      revert HedgeTypeNotAllowed(hedgeType);
    }
    // require(hedgeType == HEDGETYPE.USER_HEDGE, "Not allowed");

    bytes32 _market = abi.decode(data, (bytes32));

    _closeUserHedge(_market);
  }

  /******************************************************
   * VAULT TRANSFERS
   *****************************************************/
  /**
   * @notice transfer from vault
   * @param _amount quote amount to transfer
   */
  function _trasferFromVault(uint _amount) internal override {
    require(
      quoteAsset.transferFrom(address(vault), address(this), _amount),
      "collateral transfer from vault failed"
    );
  }

  /**
   * @notice transfer to vault
   * @param _quoteBal quote amount to transfer
   */
  function _trasferFundsToVault(uint _quoteBal) internal override {
    if (_quoteBal > 0 && !quoteAsset.transfer(address(otusVault), _quoteBal)) {
      revert QuoteTransferFailed(address(this), address(otusVault), _quoteBal);
    }
    emit QuoteReturnedToLP(_quoteBal);
  }
}
