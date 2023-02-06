// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {BaseFuturesAdapter} from "./BaseFuturesAdapter.sol";

// Libraries
import "../../interfaces/synthetix/IFuturesMarket.sol";

contract SynthetixAdapter is BaseFuturesAdapter {
  using DecimalMath for uint;
  using SafeCast for uint;
  using SafeCast for int;

  IFuturesMarket public futuresMarket;

  mapping(bytes32 => IFuturesMarket) public futuresMarkets;

  constructor(address[] _synthetix) {
    futuresMarket = IFuturesMarket(_synthetix[0]); // support more than eth
  }

  function increasePosition(Trade memory _trade) external {
    int postionAmount = _trade.size;
    uint targetLeverage = _trade.leverage;
    int notional; // margin * leverage give the notional amount of margin required.
    int currentPositionAmount = _getCurrentPositionAmount();
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

    // before we modify position lets check if we have enough margin
    uint spot = _getPrice();

    uint requiredMargin = Math.abs(postionAmount).multiplyDecimal(spot).divideDecimal(
      targetLeverage
    ) + feeDollars;

    (, , uint128 currentMargin, , ) = futuresMarket.positions(address(this));

    if (requiredMargin >= currentMargin) {
      require(
        quoteAsset.transferFrom(address(vault), address(this), requiredMargin - currentMargin),
        "collateral transfer from vault failed"
      );

      futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - currentMargin));
    }

    if (_trade.limitOrder) {
      createOrder()
    } else {
      futuresMarket.modifyPosition(modifiedPositionAmount);
    }
  }

  function decreasePosition() external {
    // similar to increasePosition just with a size smaller than existing
    // check in the ui
    // check in strategy method
    // can use tracking code bytes32(0)

    int postionAmount = _trade.size;
    int currentPositionAmount = _getCurrentPositionAmount();
    int modifiedPositionAmount = postionAmount - currentPositionAmount;
    futuresMarket.modifyPosition(modifiedPositionAmount);

    (, , uint128 curMargin, , ) = futuresMarket.positions(address(this));

    int spare = SafeCast.toInt256(requiredMargin) - SafeCast.toInt256(curMargin);
    uint minMargin = futuresMarketSettings.minInitialMargin();
    if (requiredMargin <= minMargin) {
      // pad out spare the minimum margin required.
      spare = spare + (SafeCast.toInt256(minMargin - requiredMargin));
    }

    futuresMarket.transferMargin(spare);
    _sendAllQuoteToLP();
  }

  function cancelPosition() external /**incrase or decrease */ {
    // cancels order sent to gelato keeper
    // only required for synthetix
  }

  function createOrder() internal {
    // https://github.com/Kwenta/margin-manager/blob/main/contracts/MarginBase.sol
    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this), // execution function address
      this.executeOrder.selector, // execution function selector
      address(this), // checker (resolver) address
      abi.encodeWithSelector(this.checker.selector, orderId), // checker (resolver) calldata
      ETH // payment token
    );
  }

  function closePosition() external {
    futuresMarket.closePosition();
  }

  function _getCurrentPositionAmount() internal pure returns (int) {}

  function _modifyPosition() internal {
    futuresMarket.modifyPosition(modifiedPositionAmount);
  }
}
