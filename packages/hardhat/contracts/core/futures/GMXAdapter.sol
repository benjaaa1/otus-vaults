// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "../../interfaces/gmx/IVault.sol";
import "../../interfaces/gmx/IPositionRouter.sol";
import {BaseFuturesAdapter} from "./BaseFuturesAdapter.sol";

contract GMXAdapter is BaseFuturesAdapter {
  IVault public vault;

  IPositionRouter public positionRouter;

  IERC20 internal quoteAsset;

  constructor(address[] _gmx) {
    vault = IVault(_gmx[0]);
    positionRouter = IPositionRouter(_gmx[0]);
  }

  function increasePosition(Trade memory _trade) external {
    int positionAmount = _trade.size;

    address[] memory path;
    uint acceptableSpot;
    uint _acceptableSpotSlippage = Strategy._acceptableSpotSlippage;

    if (positionAmount < 0) {
      path = new address[](1);
      path[0] = address(quoteAsset);
      acceptableSpot = _convertToGMXPrecision(spot.divideDecimalRound(_acceptableSpotSlippage));
    } else {
      path = new address[](2);
      path[0] = address(quoteAsset);
      path[1] = address(baseAsset);
      acceptableSpot = _convertToGMXPrecision(spot.multiplyDecimal(_acceptableSpotSlippage));
    }

    uint executionFee = _getExecutionFee();

    bytes32 key = positionRouter.createIncreasePosition{value: executionFee}(
      path,
      address(baseAsset), // index token
      collateralDelta, // amount in via router is in the native currency decimals
      0, // min out
      _convertToGMXPrecision(sizeDelta),
      isLong,
      acceptableSpot,
      executionFee,
      referralCode,
      address(this)
    );

    // store key in adapter contract

    // emit event
  }

  function decreasePosition(bytes32 _key, Trade memory _trade) external /**incrase or decrease */ {

  }

  function cancelPosition() external {}

  function closePosition() external {}

  /**
   * @dev returns the execution fee plus the cost of the gas callback
   */
  function _getExecutionFee() internal view returns (uint) {
    return positionRouter.minExecutionFee();
  }

  function _convertToGMXPrecision(uint amt) internal pure returns (uint) {
    return ConvertDecimals.normaliseFrom18(amt, GMX_PRICE_PRECISION);
  }
}
