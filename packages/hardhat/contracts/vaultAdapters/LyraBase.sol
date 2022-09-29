//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Libraries
import {BlackScholes} from "@lyrafinance/protocol/contracts/libraries/BlackScholes.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";

// Inherited
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces
import {OptionToken} from "@lyrafinance/protocol/contracts/OptionToken.sol";
import {OptionMarket} from "@lyrafinance/protocol/contracts/OptionMarket.sol";
import {LiquidityPool} from "@lyrafinance/protocol/contracts/LiquidityPool.sol";
import {ShortCollateral} from "@lyrafinance/protocol/contracts/ShortCollateral.sol";
import {OptionGreekCache} from "@lyrafinance/protocol/contracts/OptionGreekCache.sol";
import {SynthetixAdapter} from "@lyrafinance/protocol/contracts/SynthetixAdapter.sol";
import {BasicFeeCounter} from "@lyrafinance/protocol/contracts/periphery/BasicFeeCounter.sol";
import {OptionMarketPricer} from "@lyrafinance/protocol/contracts/OptionMarketPricer.sol";
import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";

/**
 * @title LyraBase
 * @author Lyra
 * @dev for each lyra market deployed by otus
 */
contract LyraBase {
  using DecimalMath for uint;

  ///////////////////////
  // Abstract Contract //
  ///////////////////////

  struct Strike {
    uint id;
    uint expiry;
    uint strikePrice;
    uint skew;
    uint boardIv;
  }

  struct Board {
    uint id;
    uint expiry;
    uint boardIv;
    uint[] strikeIds;
  }

  struct OptionPosition {
    uint positionId;
    uint strikeId;
    OptionType optionType;
    uint amount;
    uint collateral;
    PositionState state;
  }

  enum OptionType {
    LONG_CALL,
    LONG_PUT,
    SHORT_CALL_BASE,
    SHORT_CALL_QUOTE,
    SHORT_PUT_QUOTE
  }

  enum PositionState {
    EMPTY,
    ACTIVE,
    CLOSED,
    LIQUIDATED,
    SETTLED,
    MERGED
  }

  struct TradeInputParameters {
    uint strikeId;
    uint positionId;
    uint iterations;
    OptionType optionType;
    uint amount;
    uint setCollateralTo;
    uint minTotalCost;
    uint maxTotalCost;
    address rewardRecipient;
  }

  struct TradeResult {
    uint positionId;
    uint totalCost;
    uint totalFee;
  }

  struct Liquidity {
    uint usedCollat;
    uint usedDelta;
    uint pendingDelta;
    uint freeLiquidity;
  }

  struct MarketParams {
    uint standardSize;
    uint skewAdjustmentParam;
    int rateAndCarry;
    int deltaCutOff;
  }

  struct ExchangeRateParams {
    // current snx oracle base price
    uint spotPrice;
    // snx spot exchange rate from quote to base
    uint quoteBaseFeeRate;
    // snx spot exchange rate from base to quote
    uint baseQuoteFeeRate;
  }

  ///////////////
  // Variables //
  ///////////////

  OptionToken internal optionToken;
  OptionMarket public optionMarket;
  LiquidityPool internal liquidityPool;
  ShortCollateral internal shortCollateral;
  SynthetixAdapter internal immutable synthetixAdapter;
  OptionMarketPricer internal optionPricer;
  OptionGreekCache internal greekCache;
  GWAVOracle internal gwavOracle;

  // BasicFeeCounter internal feeCounter;

  /**
   * @notice Assigns synthetix adapter
   * @param _synthetixAdapter SynthetixAdapter address
   * @param _optionToken OptionToken Address
   * @param _optionMarket OptionMarket Address
   * @param _liquidityPool LiquidityPool address
   * @param _shortCollateral ShortCollateral address
   * @param _optionPricer OptionPricer address
   * @param _greekCache GreekCache address
   * @param _gwavOracle GWAVOracle address
   */
  constructor(
    address _synthetixAdapter,
    address _optionToken,
    address _optionMarket,
    address _liquidityPool,
    address _shortCollateral,
    address _optionPricer,
    address _greekCache,
    address _gwavOracle
  ) {
    synthetixAdapter = SynthetixAdapter(_synthetixAdapter);
    optionToken = OptionToken(_optionToken); // option token will be different
    optionMarket = OptionMarket(_optionMarket); // option market will be different
    liquidityPool = LiquidityPool(_liquidityPool); // liquidity pool will be different
    shortCollateral = ShortCollateral(_shortCollateral); // short collateral will be different
    optionPricer = OptionMarketPricer(_optionPricer);
    greekCache = OptionGreekCache(_greekCache);
    gwavOracle = GWAVOracle(_gwavOracle);
  }

  //////////////
  // Exchange //
  //////////////

  /**
   * @notice helper to get price of asset
   * @return spotPrice
   */
  function getSpotPriceForMarket() public view returns (uint spotPrice) {
    spotPrice = synthetixAdapter.getSpotPriceForMarket(address(optionMarket));
  }

  ////////////////////
  // Market Getters //
  ////////////////////

  function getOptionMarket() external view returns (address) {
    return address(optionMarket);
  }

  function getLiveBoards() internal view returns (uint[] memory liveBoards) {
    liveBoards = optionMarket.getLiveBoards();
  }

  // get all board related info (non GWAV)
  function getBoard(uint boardId) internal view returns (Board memory) {
    OptionMarket.OptionBoard memory board = optionMarket.getOptionBoard(boardId);
    return Board({id: board.id, expiry: board.expiry, boardIv: board.iv, strikeIds: board.strikeIds});
  }

  // get all strike related info (non GWAV)
  function getStrikes(uint[] memory strikeIds) public view returns (Strike[] memory allStrikes) {
    allStrikes = new Strike[](strikeIds.length);

    for (uint i = 0; i < strikeIds.length; i++) {
      (OptionMarket.Strike memory strike, OptionMarket.OptionBoard memory board) = optionMarket.getStrikeAndBoard(
        strikeIds[i]
      );

      allStrikes[i] = Strike({
        id: strike.id,
        expiry: board.expiry,
        strikePrice: strike.strikePrice,
        skew: strike.skew,
        boardIv: board.iv
      });
    }
    return allStrikes;
  }

  // iv * skew only
  function getVols(uint[] memory strikeIds) public view returns (uint[] memory vols) {
    vols = new uint[](strikeIds.length);

    for (uint i = 0; i < strikeIds.length; i++) {
      (OptionMarket.Strike memory strike, OptionMarket.OptionBoard memory board) = optionMarket.getStrikeAndBoard(
        strikeIds[i]
      );

      vols[i] = board.iv.multiplyDecimal(strike.skew);
    }
    return vols;
  }

  // get deltas only
  function getDeltas(uint[] memory strikeIds) public view returns (int[] memory callDeltas) {
    callDeltas = new int[](strikeIds.length);
    for (uint i = 0; i < strikeIds.length; i++) {
      BlackScholes.BlackScholesInputs memory bsInput = _getBsInput(strikeIds[i]);
      (callDeltas[i], ) = BlackScholes.delta(bsInput);
    }
  }

  function getVegas(uint[] memory strikeIds) public view returns (uint[] memory vegas) {
    vegas = new uint[](strikeIds.length);
    for (uint i = 0; i < strikeIds.length; i++) {
      BlackScholes.BlackScholesInputs memory bsInput = _getBsInput(strikeIds[i]);
      vegas[i] = BlackScholes.vega(bsInput);
    }
  }

  // get pure black-scholes premium
  function getPurePremium(
    uint secondsToExpiry,
    uint vol,
    uint spotPrice,
    uint strikePrice
  ) public view returns (uint call, uint put) {
    BlackScholes.BlackScholesInputs memory bsInput = BlackScholes.BlackScholesInputs({
      timeToExpirySec: secondsToExpiry,
      volatilityDecimal: vol,
      spotDecimal: spotPrice,
      strikePriceDecimal: strikePrice,
      rateDecimal: greekCache.getGreekCacheParams().rateAndCarry
    });
    (call, put) = BlackScholes.optionPrices(bsInput);
  }

  // get pure black-scholes premium
  function getPurePremiumForStrike(uint strikeId) internal view returns (uint call, uint put) {
    BlackScholes.BlackScholesInputs memory bsInput = _getBsInput(strikeId);
    (call, put) = BlackScholes.optionPrices(bsInput);
  }

  function getFreeLiquidity() internal view returns (uint freeLiquidity) {
    freeLiquidity = liquidityPool.getCurrentLiquidity().freeLiquidity;
  }

  function getMarketParams() internal view returns (MarketParams memory) {
    return
      MarketParams({
        standardSize: optionPricer.getPricingParams().standardSize,
        skewAdjustmentParam: optionPricer.getPricingParams().skewAdjustmentFactor,
        rateAndCarry: greekCache.getGreekCacheParams().rateAndCarry,
        deltaCutOff: optionPricer.getTradeLimitParams().minDelta
      });
  }

  // get spot price of sAsset and exchange fee percentages
  function getExchangeParams() internal view returns (ExchangeRateParams memory) {
    SynthetixAdapter.ExchangeParams memory params = synthetixAdapter.getExchangeParams(address(optionMarket));
    return
      ExchangeRateParams({
        spotPrice: params.spotPrice,
        quoteBaseFeeRate: params.quoteBaseFeeRate,
        baseQuoteFeeRate: params.baseQuoteFeeRate
      });
  }

  /////////////////////////////
  // Option Position Getters //
  /////////////////////////////

  function getPositions(uint[] memory positionIds) internal view returns (OptionPosition[] memory) {
    OptionToken.OptionPosition[] memory positions = optionToken.getOptionPositions(positionIds);

    OptionPosition[] memory convertedPositions = new OptionPosition[](positions.length);
    for (uint i = 0; i < positions.length; i++) {
      convertedPositions[i] = OptionPosition({
        positionId: positions[i].positionId,
        strikeId: positions[i].strikeId,
        optionType: OptionType(uint(positions[i].optionType)),
        amount: positions[i].amount,
        collateral: positions[i].collateral,
        state: PositionState(uint(positions[i].state))
      });
    }

    return convertedPositions;
  }

  function getMinCollateral(
    OptionType optionType,
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount
  ) internal view returns (uint) {
    return
      greekCache.getMinCollateral(OptionMarket.OptionType(uint(optionType)), strikePrice, expiry, spotPrice, amount);
  }

  function getMinCollateralForPosition(uint positionId) internal view returns (uint) {
    OptionToken.PositionWithOwner memory position = optionToken.getPositionWithOwner(positionId);
    if (_isLong(OptionType(uint(position.optionType)))) return 0;

    uint strikePrice;
    uint expiry;
    (strikePrice, expiry) = optionMarket.getStrikeAndExpiry(position.strikeId);

    return
      getMinCollateral(
        OptionType(uint(position.optionType)),
        strikePrice,
        expiry,
        synthetixAdapter.getSpotPriceForMarket(address(optionMarket)),
        position.amount
      );
  }

  function getMinCollateralForStrike(
    OptionType optionType,
    uint strikeId,
    uint amount
  ) internal view returns (uint) {
    if (_isLong(optionType)) return 0;

    uint strikePrice;
    uint expiry;
    (strikePrice, expiry) = optionMarket.getStrikeAndExpiry(strikeId);

    return
      getMinCollateral(
        optionType,
        strikePrice,
        expiry,
        synthetixAdapter.getSpotPriceForMarket(address(optionMarket)),
        amount
      );
  }

  //////////
  // Misc //
  //////////

  function _getBsInput(uint strikeId) internal view returns (BlackScholes.BlackScholesInputs memory bsInput) {
    (OptionMarket.Strike memory strike, OptionMarket.OptionBoard memory board) = optionMarket.getStrikeAndBoard(
      strikeId
    );
    bsInput = BlackScholes.BlackScholesInputs({
      timeToExpirySec: board.expiry - block.timestamp,
      volatilityDecimal: board.iv.multiplyDecimal(strike.skew),
      spotDecimal: synthetixAdapter.getSpotPriceForMarket(address(optionMarket)),
      strikePriceDecimal: strike.strikePrice,
      rateDecimal: greekCache.getGreekCacheParams().rateAndCarry
    });
  }

  function _isLong(OptionType optionType) internal pure returns (bool) {
    return (optionType < OptionType.SHORT_CALL_BASE);
  }

  //////////
  // Misc //
  //////////

  function volGWAV(uint strikeId, uint secondsAgo) public view returns (uint) {
    OptionMarket.Strike memory strike = optionMarket.getStrike(strikeId);

    return gwavOracle.ivGWAV(strike.boardId, secondsAgo).multiplyDecimal(gwavOracle.skewGWAV(strikeId, secondsAgo));
  }
}
