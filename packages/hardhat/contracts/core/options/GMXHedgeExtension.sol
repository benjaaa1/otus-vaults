//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// interfaces
import "../../interfaces/gmx/IAggregatorV3.sol";
import "../../interfaces/gmx/IVault.sol";
import "../../interfaces/gmx/IPositionRouter.sol";

// inherits
import {BaseHedgeExtension} from "./BaseHedgeExtension.sol";

// libraries
import "../../libraries/ConvertDecimals.sol";
import "../../libraries/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract GMXHedgeExtension is BaseHedgeExtension {
  uint256 public constant GMX_PRICE_PRECISION = 10 ** 30;

  struct PositionDetails {
    uint256 size;
    uint256 collateral;
    uint256 averagePrice;
    uint256 entryFundingRate;
    // int256 realisedPnl;
    int256 unrealisedPnl;
    uint256 lastIncreasedTime;
    bool isLong;
  }

  struct CurrentPositions {
    PositionDetails longPosition;
    PositionDetails shortPosition;
    uint amountOpen;
    bool isLong; // only valid if amountOpen == 1
  }

  /************************************************
   *   STATE
   ************************************************/

  /// @dev market to chainlink feed
  mapping(bytes32 => AggregatorV2V3Interface) public chainlinkFeeds;

  IVault public gmxVault;

  IPositionRouter public positionRouter;

  error InvalidMarket(address thrower, bytes32 market);
  error InvalidPriceFeedAddress(address thrower, AggregatorV2V3Interface inputAddress);
  event ChainlinkAggregatorUpdated(bytes32 indexed market, address indexed aggregator);

  error InvalidAddress(address thrower, address vault);
  event GMXVaultAddressUpdated(address _vault);

  /// @notice Sets the GMX vault contract
  function setVaultContract(IVault _vault) internal {
    if (address(_vault) == address(0)) revert InvalidAddress(address(this), address(_vault));

    gmxVault = _vault;

    emit GMXVaultAddressUpdated(address(_vault));
  }

  /**
   * @notice Sets an assets chainlink pricefeed
   */
  function setChainlinkFeed(bytes32 _market, AggregatorV2V3Interface _assetPriceFeed) internal {
    if (_market == bytes32(0)) revert InvalidMarket(address(this), _market);
    if (address(_assetPriceFeed) == (address(0)))
      revert InvalidPriceFeedAddress(address(this), _assetPriceFeed);

    chainlinkFeeds[_market] = _assetPriceFeed;

    emit ChainlinkAggregatorUpdated(_market, address(_assetPriceFeed));
  }

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
    // // only be one position open for the user hedge
    // CurrentPositions memory positions = _getPositions();
    // uint currentHedge = positions.longPosition.hedge;
    // uint spotPrice = _getSpotPrice(_market);
    // // get current size open in gmx vault
    // // _hedgeSize also larger than 0
    // if (currentHedge > _hedgeSize) {
    //   // decrease hedge
    //   _decreasePosition(spot);
    //   // already have all margin needed
    //   // emit event
    //   return;
    // }
    // // To get to this point, there is either no position open, or a position on the same side as we want.
    // bool isLong = _hedgeSize > 0;
    // // sizeDelta is the change in current delta required to get to the desired hedge. It is in USD terms
    // uint sizeDelta = Math.abs(expectedHedge - currHedgedNetDelta).multiplyDecimal(spot);
    // // calculate the expected collateral given the new expected hedge
    // uint expectedCollateral = _getTargetCollateral(Math.abs(expectedHedge).multiplyDecimal(spot));
    // uint collatAmount = currentPos.collateral;
    // IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    // IFuturesMarketSettings futuresMarketSettings = futuresMarketsSettingsByKey[_market];
    // // check if there is enough roundhedgefunds left over
    // int currHedgedNetDelta = _getPositionDelta();
    // int modifiedPositionAmount = _hedgeSize - currHedgedNetDelta;
    // uint targetLeverage = userHedgeStrategy.targetLeverage; // get this from strategy? // will be max leverage can go up
    // uint feeDollars = _getOrderFee(modifiedPositionAmount, targetLeverage);
    // uint requiredMargin = Math.abs(_hedgeSize).multiplyDecimal(spotPrice).divideDecimal(
    //   targetLeverage
    // ) + feeDollars;
    // (, , uint128 curMargin, , ) = _getPositions();
    // if (Math.abs(_hedgeSize) >= Math.abs(currHedgedNetDelta)) {
    //   if (requiredMargin > curMargin) {
    //     // add require that there is enough in committed margin
    //     committedHedgeMargin = committedHedgeMargin - (requiredMargin - curMargin);
    //     futuresMarket.transferMargin(SafeCast.toInt256(requiredMargin - curMargin));
    //   }
    //   // modify position
    //   futuresMarket.modifyPosition(modifiedPositionAmount);
    // } else {
    //   // remove margin
    //   futuresMarket.modifyPosition(modifiedPositionAmount); // fee issues here somewhere.
    //   // 50 dollars should almost always remain in the pool.
    //   // currMargin is larger than required Margin.
    //   int spare = SafeCast.toInt256(requiredMargin) - SafeCast.toInt256(curMargin);
    //   uint minMargin = futuresMarketSettings.minInitialMargin();
    //   if (requiredMargin <= minMargin) {
    //     // pad out spare the minimum margin required.
    //     spare = spare + (SafeCast.toInt256(minMargin - requiredMargin));
    //   }
    //   // reduces the margin as less is required due to reduce deltas.
    //   futuresMarket.transferMargin(spare);
    // }
  }

  function _getTargetCollateral(uint size) internal view returns (uint) {
    // return size.divideDecimal(futuresPoolHedgerParams.targetLeverage);
  }

  /**
   * @notice close position user hedge
   * @param _market market to close
   */
  function _closeUserHedge(bytes32 _market) internal override {
    // IFuturesMarket futuresMarket = futuresMarketsByKey[_market];
    // futuresMarket.closePosition();
    // futuresMarket.withdrawAllMargin();
  }

  /************************************************
   *  DYNAMIC HEDGE - TO DO
   ***********************************************/

  /******************************************************
   * GMX INTERNAL HELPERS
   *****************************************************/

  /**
   * @dev returns the execution fee plus the cost of the gas callback
   */
  function _getExecutionFee() internal view returns (uint) {
    return positionRouter.minExecutionFee();
  }

  function _convertToGMXPrecision(uint amt) internal pure returns (uint) {
    // return ConvertDecimals.normaliseFrom18(amt, GMX_PRICE_PRECISION);
  }

  /**
   * @notice get base asset price from Chainlink aggregator
   * @param _market market btc / eth
   * @return spotPrice price in 18 decimals
   */
  function _getSpotPrice(bytes32 _market) internal view returns (uint) {
    // uint clPrice = _getChainlinkPrice(optionMarket);
    // return clPrice;
  }

  /**
   * @notice get base asset price from Chainlink aggregator
   * @param _market market btc / eth
   * @return spotPrice price in 18 decimals
   */
  function _getChainlinkPrice(address _market) internal view returns (uint spotPrice) {
    // AggregatorV2V3Interface assetPriceFeed = chainlinkFeeds[_market];
    // if (assetPriceFeed == AggregatorV2V3Interface(address(0))) {
    //   revert InvalidPriceFeedAddress(address(this), assetPriceFeed);
    // }
    // // use latestRoundData because getLatestAnswer is deprecated
    // (, int answer, , uint updatedAt, ) = assetPriceFeed.latestRoundData();
    // if (
    //   answer <= 0 ||
    //   block.timestamp - updatedAt > marketPricingParams[optionMarket].chainlinkStalenessCheck
    // ) {
    //   revert InvalidAnswer(address(this), answer, updatedAt, block.timestamp);
    // }
    // spotPrice = ConvertDecimals.convertTo18(answer.toUint256(), assetPriceFeed.decimals());
  }

  /**
   * @dev Gets the current open positions. Will return an empty object where a position is not open. First will be long
   * Second will be short.
   */
  function _getPositions() internal view returns (CurrentPositions memory positions) {
    PositionDetails memory longResult = _getPosition(true);
    PositionDetails memory shortResult = _getPosition(false);

    uint amountOpen = 0;
    if (longResult.size > 0) {
      amountOpen += 1;
    }
    if (shortResult.size > 0) {
      amountOpen += 1;
    }

    bool isLong = longResult.size > shortResult.size;

    return
      CurrentPositions({
        longPosition: longResult,
        shortPosition: shortResult,
        amountOpen: amountOpen,
        isLong: isLong
      });
  }

  /**
   * @dev get position detail that includes unrealised PNL
   */
  function _getPosition(bool isLong) internal view returns (PositionDetails memory) {
    // address collatToken = isLong ? address(baseAsset) : address(quoteAsset);
    // (
    //   uint size,
    //   uint collateral,
    //   uint averagePrice,
    //   uint entryFundingRate, // uint reserveAmount: GMX internal variable to keep track of collateral reserved for position // uint realised profit: historical pnl // bool hasProfit: if the vault had previously realised profit or loss
    //   ,
    //   ,
    //   ,
    //   uint lastIncreasedTime
    // ) = vault.getPosition(address(this), collatToken, address(baseAsset), isLong);
    // int unrealisedPnl = 0;
    // if (averagePrice > 0) {
    //   // getDelta will revert if average price == 0;
    //   (bool hasUnrealisedProfit, uint absUnrealisedPnl) = vault.getDelta(
    //     address(baseAsset),
    //     size,
    //     averagePrice,
    //     isLong,
    //     lastIncreasedTime
    //   );
    //   if (hasUnrealisedProfit) {
    //     unrealisedPnl = _convertFromGMXPrecision(absUnrealisedPnl).toInt256();
    //   } else {
    //     unrealisedPnl = -_convertFromGMXPrecision(absUnrealisedPnl).toInt256();
    //   }
    // }
    // return
    //   PositionDetails({
    //     size: _convertFromGMXPrecision(size),
    //     collateral: _convertFromGMXPrecision(collateral),
    //     averagePrice: _convertFromGMXPrecision(averagePrice),
    //     entryFundingRate: entryFundingRate, // store in initial percision, will be used in vault.getFundingFee
    //     unrealisedPnl: unrealisedPnl,
    //     lastIncreasedTime: lastIncreasedTime,
    //     isLong: isLong
    //   });
  }

  function _convertFromGMXPrecision(uint amt) internal pure returns (uint) {
    return ConvertDecimals.normaliseTo18(amt, GMX_PRICE_PRECISION);
  }
}
