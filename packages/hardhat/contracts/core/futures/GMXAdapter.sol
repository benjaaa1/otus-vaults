// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// interfaces
import "../../interfaces/gmx/IVault.sol";
import "../../interfaces/gmx/IPositionRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// inheritance
import {BaseFuturesAdapter} from "./BaseFuturesAdapter.sol";
import "../../interfaces/IOtusController.sol";

contract GMXAdapter is BaseFuturesAdapter {
  // susd is used for quoteasset
  IERC20 internal immutable quoteAsset;

  IVault public gmxVault;

  IPositionRouter public positionRouter;

  // address of vault it's strategizing for
  address public strategyVault;

  constructor(address _quoteAsset, address[] memory _gmx) {
    quoteAsset = IERC20(_quoteAsset);
    gmxVault = IVault(_gmx[0]);
    positionRouter = IPositionRouter(_gmx[0]);
  }

  /**
   * @notice Initializer strategy futures
   * @param _vault vault that owns strategy
   */
  function adapterInitialize(address _vault) internal {
    strategyVault = _vault;
  }

  function increasePosition(FuturesTrade memory _trade) internal override {
    // int positionAmount = _trade.size;
    // address[] memory path;
    // uint acceptableSpot;
    // uint _acceptableSpotSlippage = Strategy._acceptableSpotSlippage;
    // if (positionAmount < 0) {
    //   path = new address[](1);
    //   path[0] = address(quoteAsset);
    //   acceptableSpot = _convertToGMXPrecision(spot.divideDecimalRound(_acceptableSpotSlippage));
    // } else {
    //   path = new address[](2);
    //   path[0] = address(quoteAsset);
    //   path[1] = address(baseAsset);
    //   acceptableSpot = _convertToGMXPrecision(spot.multiplyDecimal(_acceptableSpotSlippage));
    // }
    // uint executionFee = _getExecutionFee();
    // bytes32 key = positionRouter.createIncreasePosition{value: executionFee}(
    //   path,
    //   address(baseAsset), // index token
    //   collateralDelta, // amount in via router is in the native currency decimals
    //   0, // min out
    //   _convertToGMXPrecision(sizeDelta),
    //   isLong,
    //   acceptableSpot,
    //   executionFee,
    //   referralCode,
    //   address(this)
    // );
    // store key in adapter contract
    // emit event
  }

  function decreasePosition(FuturesTrade memory _trade) internal override {}

  function cancelPosition() internal override {}

  function closePosition() internal override {}

  /**
   * @dev returns the execution fee plus the cost of the gas callback
   */
  function _getExecutionFee() internal view returns (uint) {
    return positionRouter.minExecutionFee();
  }

  function _convertToGMXPrecision(uint amt) internal pure returns (uint) {
    // return ConvertDecimals.normaliseFrom18(amt, GMX_PRICE_PRECISION);
  }
}
