//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// Inherit
import {BaseFuturesAdapter} from "./BaseFuturesAdapter.sol";

// Interfaces
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/synthetix/IExchangeRates.sol";
import "../../interfaces/synthetix/IFuturesMarket.sol";

// Libraries
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../../libraries/Math.sol";

// Gelato keeper utils
import "../utils/OpsReady.sol";

contract SynthetixAdapter is OpsReady, BaseFuturesAdapter {
  using DecimalMath for uint;
  using SafeCast for uint;
  using SafeCast for int;

  // susd is used for quoteasset
  IERC20 internal immutable quoteAsset;

  /************************************************
   *  STATE - Controller and Markets available
   ***********************************************/

  // futures markets
  mapping(bytes32 => IFuturesMarket) public futuresMarkets;

  // address of vault it's strategizing for
  address public strategyVault;

  /************************************************
   *  STATE - Orders
   ***********************************************/

  struct Order {
    OrderTypes orderType;
    bytes32 marketKey;
    uint marginDelta;
    int sizeDelta;
    uint targetPrice;
    bytes32 gelatoTaskId;
    uint maxDynamicFee;
  }

  uint public orderId;

  mapping(uint => Order) public orders;

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  constructor(address _quoteAsset, bytes32[] memory _markets, address[] memory _synthetix) {
    quoteAsset = IERC20(_quoteAsset);

    for (uint i = 0; i < _markets.length; i++) {
      bytes32 market = _markets[i];
      futuresMarkets[market] = IFuturesMarket(_synthetix[i]);
    }
  }

  /**
   * @notice Initializer strategy futures
   * @param _vault vault that owns strategy
   */
  function adapterInitialize(address _vault) internal {
    strategyVault = _vault;
  }

  function _trade() external payable {}

  /**
   * @notice Increase Position - check current synthetix margin and leverage
   * @param _trade _trade details
   */
  function increasePosition(FuturesTrade memory _trade) internal override {
    IFuturesMarket futuresMarket = futuresMarkets[_trade.market];

    int postionAmount = _trade.sizeDelta;
    uint targetLeverage;
    int notional; // margin * leverage give the notional amount of margin required.
    int currentPositionAmount = _getCurrentPositionAmount(_trade.market);
    int modifiedPositionAmount = postionAmount - currentPositionAmount;

    if (postionAmount < 0) {
      notional = -SafeCast.toInt256(
        Math.abs(modifiedPositionAmount).multiplyDecimal(targetLeverage)
      );
    } else {
      notional = SafeCast.toInt256(
        Math.abs(modifiedPositionAmount).multiplyDecimal(targetLeverage)
      );
    }

    (uint feeDollars, ) = futuresMarket.orderFee(notional);

    uint spot = sUSDRate(_trade.market);

    // before we modify position lets check if we have enough margin
    uint requiredMargin = Math.abs(postionAmount).multiplyDecimal(spot).divideDecimal(
      targetLeverage
    ) + feeDollars;

    (, , uint128 currentMargin, , ) = futuresMarket.positions(address(this));

    if (requiredMargin >= currentMargin) {
      require(
        quoteAsset.transferFrom(
          address(strategyVault),
          address(this),
          requiredMargin - currentMargin
        ),
        "collateral transfer from vault failed"
      );

      futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - currentMargin));
    }

    if (_trade.orderType == OrderTypes.LIMIT) {
      createOrder(_trade);
    } else {
      futuresMarket.modifyPosition(modifiedPositionAmount);
    }
  }

  /**
   * @notice Decrease Position - check current synthetix margin and leverage
   * @param _trade _trade details
   */
  function decreasePosition(FuturesTrade memory _trade) internal override {
    IFuturesMarket futuresMarket = futuresMarkets[_trade.market];

    // similar to increasePosition just with a size smaller than existing
    // check in the ui
    // check in strategy method
    // can use tracking code bytes32(0)

    int postionAmount = _trade.sizeDelta;
    int currentPositionAmount = _getCurrentPositionAmount(_trade.market);
    int modifiedPositionAmount = postionAmount - currentPositionAmount;
    futuresMarket.modifyPosition(modifiedPositionAmount);

    (, , uint128 curMargin, , ) = futuresMarket.positions(address(this));

    // int spare = SafeCast.toInt256(requiredMargin) - SafeCast.toInt256(curMargin);
    // uint minMargin = futuresMarketSettings.minInitialMargin();
    // if (requiredMargin <= minMargin) {
    //   // pad out spare the minimum margin required.
    //   spare = spare + (SafeCast.toInt256(minMargin - requiredMargin));
    // }

    // futuresMarket.transferMargin(spare);
    // _sendAllQuoteToLP();
  }

  function cancelPosition() internal override /**incrase or decrease */ {
    // cancels order sent to gelato keeper
    // only required for synthetix
  }

  function closePosition() internal override {
    // futuresMarket.closePosition();
  }

  /************************************************
   *  LIMIT ORDER HANDLING
   ***********************************************/

  /**
   * @notice Create order
   * @param _trade _trade details
   * @dev prepare order id to send to gelato keeper
   * @dev https://github.com/Kwenta/margin-manager/blob/main/contracts/MarginBase.sol
   */
  function createOrder(FuturesTrade memory _trade) internal {
    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this), // execution function address
      this.executeOrder.selector, // execution function selector
      address(this), // checker (resolver) address
      abi.encodeWithSelector(this.checker.selector, orderId), // checker (resolver) calldata
      ETH // payment token
    );

    orders[orderId] = Order({
      orderType: _trade.orderType, // limit order stop order
      marketKey: _trade.market,
      marginDelta: 0, // _marginDelta,
      sizeDelta: _trade.sizeDelta,
      targetPrice: _trade.targetPrice,
      gelatoTaskId: taskId,
      maxDynamicFee: 0
    });

    emit OrderPlaced(address(this), orderId);

    orderId++;
  }

  /**
   * @notice execute a gelato queued order
   * @notice only keepers can trigger this function
   * @param _orderId: key for an active order
   * @dev prepare order id to send to gelato keeper
   */
  function executeOrder(uint256 _orderId) external onlyOps {
    (bool isValidOrder, uint256 fillPrice) = validOrder(_orderId);
    if (!isValidOrder) {
      revert OrderInvalid();
    }
    Order memory order = orders[_orderId];

    // // if margin was committed, free it
    // if (order.marginDelta > 0) {
    //   committedMargin -= _abs(order.marginDelta);
    // }

    // // prep new position
    // MarginBase.NewPosition[] memory newPositions = new MarginBase.NewPosition[](1);
    // newPositions[0] = NewPosition({
    //   marketKey: order.marketKey,
    //   marginDelta: order.marginDelta,
    //   sizeDelta: order.sizeDelta
    // });

    // // remove task from gelato's side
    // /// @dev optimization done for gelato
    // IOps(ops).cancelTask(order.gelatoTaskId);

    // // delete order from orders
    // delete orders[_orderId];

    // // otus remove fee
    // uint256 advancedOrderFee = order.orderType == OrderTypes.LIMIT
    //   ? marginBaseSettings.limitOrderFee()
    //   : marginBaseSettings.stopOrderFee();

    // // execute trade
    // _distributeMargin(newPositions, advancedOrderFee);

    // // pay fee
    // (uint256 fee, address feeToken) = IOps(ops).getFeeDetails();
    // _transfer(fee, feeToken);

    // emit OrderFilled(address(this), _orderId, fillPrice, fee);
  }

  // if multiple markets
  // margin can be in multiple futures markets
  // example
  // eth size - 3 leverage 3 spot - 1500 => 1500 total usd deposited
  // btc size 2 leverage 1 spot - 20k => 50k deposited
  // user wants to open new position with available margin
  // available margin will be displayed on ui
  // getAvailableMargin will be public

  // check positions
  // check available margin in each position

  // maybe i dont need

  /**
   * @notice signal to a keeper that an order is valid/invalid for execution
   * @param _orderId: key for an active order
   * @return canExec boolean that signals to keeper an order can be executed
   * @return execPayload calldata for executing an order
   */
  function checker(
    uint256 _orderId
  ) external view returns (bool canExec, bytes memory execPayload) {
    (canExec, ) = validOrder(_orderId);
    // calldata for execute func
    execPayload = abi.encodeWithSelector(this.executeOrder.selector, _orderId);
  }

  function validOrder(uint _orderId) internal view returns (bool, uint) {
    Order memory order = orders[_orderId];

    if (order.orderType == OrderTypes.LIMIT) {
      return validLimitOrder(order);
    } else if (order.orderType == OrderTypes.STOP) {
      return validStopOrder(order);
    }

    // unknown order type
    // @notice execution should never reach here
    // @dev needed to satisfy types
    return (false, 0);
  }

  /// @notice limit order logic condition checker
  /// @param order: struct for an active order
  /// @return true if order is valid by execution rules
  /// @return price that the order will be filled at (only valid if prev is true)
  function validLimitOrder(Order memory order) internal view returns (bool, uint256) {
    uint256 price = sUSDRate(order.marketKey);

    /// @notice intent is targetPrice or better despite direction
    if (order.sizeDelta > 0) {
      // Long
      return (price <= order.targetPrice, price);
    } else if (order.sizeDelta < 0) {
      // Short
      return (price >= order.targetPrice, price);
    }

    // sizeDelta == 0
    // @notice execution should never reach here
    // @dev needed to satisfy types
    return (false, price);
  }

  /// @notice stop order logic condition checker
  /// @param order: struct for an active order
  /// @return true if order is valid by execution rules
  /// @return price that the order will be filled at (only valid if prev is true)
  function validStopOrder(Order memory order) internal view returns (bool, uint256) {
    // uint256 price = sUSDRate(futuresMarket(order.marketKey));
    uint256 price = sUSDRate(order.marketKey);

    /// @notice intent is targetPrice or worse despite direction
    if (order.sizeDelta > 0) {
      // Long
      return (price >= order.targetPrice, price);
    } else if (order.sizeDelta < 0) {
      // Short
      return (price <= order.targetPrice, price);
    }

    // sizeDelta == 0
    // @notice execution should never reach here
    // @dev needed to satisfy types
    return (false, price);
  }

  /************************************************
   *  INTERNAL HELPERS
   ***********************************************/

  function _getCurrentPositionAmount(bytes32 _market) internal view returns (int) {
    IFuturesMarket futuresMarket = futuresMarkets[_market];
    (, , , , int128 size) = futuresMarket.positions(address(this));
    return size;
  }

  /// @notice get exchange rate of underlying market asset in terms of sUSD
  /// @param _market: market
  /// @return price in sUSD
  function sUSDRate(bytes32 _market) internal view returns (uint256) {
    IFuturesMarket futuresMarket = futuresMarkets[_market];
    (uint256 price, bool invalid) = futuresMarket.assetPrice();
    if (invalid) {
      revert InvalidPrice();
    }
    return price;
  }

  error InvalidPrice();

  error OrderInvalid();

  /// @notice emitted when an advanced order is placed
  /// @param account: account placing the order
  /// @param orderId: id of order

  event OrderPlaced(
    address indexed account,
    uint256 orderId
    // bytes32 marketKey,
    // int256 marginDelta,
    // int256 sizeDelta,
    // uint256 targetPrice,
    // OrderTypes orderType
  );
}

// / @param marketKey: futures market key
// / @param marginDelta: margin change
// / @param sizeDelta: size change
// / @param targetPrice: targeted fill price
