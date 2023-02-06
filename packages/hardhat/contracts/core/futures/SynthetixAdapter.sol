contract SynthetixAdapter is BaseFuturesAdapter {
  IFuturesMarket public futuresMarket;

  constructor(address[] _synthetix) {
    futuresMarket = IFuturesMarket(_synthetix[0]); // support more than eth
  }

  function increasePosition(Trade memory _trade) external {
    uint targetLeverage = _trade.leverage;
    int notional; // margin * leverage give the notional amount of margin required.

    if (_trade.isLong == false) {
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

    bool sufficientMargin = false;
    uint requiredMargin;
    (, , uint128 curMargin, , ) = futuresMarket.positions(address(this));
    if (!sufficientMargin) {
      // transfer from vault to strategy required amount
      //        liquidityPool.transferQuoteToHedge(requiredMargin - curMargin);
      futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - curMargin));
    }

    futuresMarket.modifyPosition(0);
  }

  function decreasePosition() external {
    // similar to increasePosition just with a size smaller than existing
    // check in the ui
    // check in strategy method
    // can use tracking code bytes32(0)
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

  function _modifyPosition() internal {
    futuresMarket.modifyPosition(modifiedPositionAmount);
  }
}
