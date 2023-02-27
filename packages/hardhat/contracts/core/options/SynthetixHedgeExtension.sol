//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// interfaces
import "../../interfaces/synthetix/IFuturesMarket.sol";
import "../../interfaces/synthetix/IFuturesMarketSettings.sol";

// inherits
import {BaseHedgeExtension} from "./BaseHedgeExtension.sol";

import "../../synthetix/SignedSafeDecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";
import "../../libraries/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../utils/OpsReady.sol";

contract SynthetixHedgeExtension is BaseHedgeExtension {
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  /************************************************
   *  ERRORS
   ***********************************************/

  /// @notice synthetix invalid price
  error InvalidPrice();

  /************************************************
   *   STATE - HEDGE TRACKING
   ************************************************/

  // set on init copied from outscontroller
  mapping(bytes32 => IFuturesMarket) public futuresMarketsByKey;

  mapping(bytes32 => IFuturesMarketSettings) public futuresMarketsSettingsByKey;

  /*****************************************************
   *  USER HEDGE
   *****************************************************/

  /**
   * @notice one click delta hedge
   * @param _market btc or eth
   * @param _hedgeSize total size of hedge
   * @dev add onlyvault check
   */
  function _openUserHedge(bytes32 _market, int _hedgeSize) internal override {
    IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    IFuturesMarketSettings futuresMarketSettings = futuresMarketsSettingsByKey[_market];
    // check if there is enough roundhedgefunds left over
    int currHedgedNetDelta = _getPositionDelta(_market);
    int modifiedPositionAmount = _hedgeSize - currHedgedNetDelta;
    uint targetLeverage = userHedgeStrategy.targetLeverage; // get this from strategy? // will be max leverage can go up

    uint feeDollars = _getOrderFee(_market, modifiedPositionAmount, targetLeverage);

    uint spotPrice = _sUSDRate(_market);

    uint requiredMargin = Math.abs(_hedgeSize).multiplyDecimal(spotPrice).divideDecimal(
      targetLeverage
    ) + feeDollars;

    (, , uint128 curMargin, , ) = futuresMarket.positions(address(this));

    if (Math.abs(_hedgeSize) >= Math.abs(currHedgedNetDelta)) {
      if (requiredMargin > curMargin) {
        // add require that there is enough in committed margin
        committedHedgeMargin = committedHedgeMargin - (requiredMargin - curMargin);
        futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - curMargin));
      }
      // modify position
      futuresMarket.modifyPosition(modifiedPositionAmount);
    } else {
      // remove margin
      futuresMarket.modifyPosition(modifiedPositionAmount); // fee issues here somewhere.
      // 50 dollars should almost always remain in the pool.
      // currMargin is larger than required Margin.
      int spare = SafeCast.toInt256(requiredMargin) - SafeCast.toInt256(curMargin);
      uint minMargin = futuresMarketSettings.minInitialMargin();
      if (requiredMargin <= minMargin) {
        // pad out spare the minimum margin required.
        spare = spare + (SafeCast.toInt256(minMargin - requiredMargin));
      }

      // reduces the margin as less is required due to reduce deltas.
      futuresMarket.transferMargin(spare);
    }

    emit HedgeOpen(HEDGETYPE.USER_HEDGE, _hedgeSize, spotPrice);
  }

  /**
   * @notice close position user hedge
   * @param _market market to close
   */
  function _closeUserHedge(bytes32 _market) internal override {
    IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    futuresMarket.closePosition();
    futuresMarket.withdrawAllMargin();
    emit HedgeClose(HEDGETYPE.USER_HEDGE);
  }

  /************************************************
   *  DYNAMIC HEDGE - TO DO
   ***********************************************/

  /******************************************************
   * SYNTHETIX INTERNAL HELPERS
   *****************************************************/

  /**
   * @notice get asset price
   * @param _market btc or eth
   */
  function _sUSDRate(bytes32 _market) internal view returns (uint256) {
    IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    (uint256 price, bool invalid) = futuresMarket.assetPrice();
    if (invalid) {
      revert InvalidPrice();
    }
    return price;
  }

  /**
   * @notice get asset price
   * @param _market btc or eth
   * @param _modifiedPositionAmount amount
   * @param _targetLeverage leverage size
   */
  function _getOrderFee(
    bytes32 _market,
    int _modifiedPositionAmount,
    uint _targetLeverage
  ) internal view returns (uint feeDollars) {
    IFuturesMarket futuresMarket = futuresMarketsByKey[_market];

    int notional;
    if (_modifiedPositionAmount < 0) {
      notional = -SafeCast.toInt256(
        Math.abs(_modifiedPositionAmount).multiplyDecimal(_targetLeverage)
      );
    } else {
      notional = SafeCast.toInt256(
        Math.abs(_modifiedPositionAmount).multiplyDecimal(_targetLeverage)
      );
    }

    (feeDollars, ) = futuresMarket.orderFee(notional);
  }

  /**
   * @notice gets position delta in futures markets
   * @return size current hedgesize
   */
  function _getPositionDelta(bytes32 _market) internal view returns (int) {
    IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    (, , , , int128 size) = futuresMarket.positions(address(this));
    return size;
  }
}
