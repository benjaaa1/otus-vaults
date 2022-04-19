//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Libraries
import {BlackScholes} from '@lyrafinance/core/contracts/lib/BlackScholes.sol';
import {DecimalMath} from '@lyrafinance/core/contracts/synthetix/DecimalMath.sol';
import './interfaces/IFuturesMarket.sol';

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces
import {OptionToken} from '@lyrafinance/core/contracts/OptionToken.sol';
import {OptionMarket} from '@lyrafinance/core/contracts/OptionMarket.sol';
import {LiquidityPool} from '@lyrafinance/core/contracts/LiquidityPool.sol';
import {ShortCollateral} from '@lyrafinance/core/contracts/ShortCollateral.sol';
import {OptionGreekCache} from '@lyrafinance/core/contracts/OptionGreekCache.sol';
import {SynthetixAdapter} from '@lyrafinance/core/contracts/SynthetixAdapter.sol';
import {BasicFeeCounter} from '@lyrafinance/core/contracts/periphery/BasicFeeCounter.sol';
import {ICurve} from '@lyrafinance/core/contracts/interfaces/ICurve.sol';
import {OptionMarketPricer} from '@lyrafinance/core/contracts/OptionMarketPricer.sol';

/**
 * @title VaultAdapter 
 * @author Lyra
 * @dev LyraAdapter but inherits from OwnerUpgradable - Provides helpful functions for the vault adapter
 */

contract VaultAdapter is OwnableUpgradeable {
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
    uint spotPrice;
    uint quoteBaseFeeRate;
    uint baseQuoteFeeRate;
  }

  ///////////////
  // Variables //
  ///////////////

  ICurve immutable internal curveSwap;
  OptionToken immutable internal optionToken;
  OptionMarket immutable internal optionMarket;
  LiquidityPool immutable internal liquidityPool;
  ShortCollateral immutable internal shortCollateral;
  SynthetixAdapter immutable internal synthetixAdapter;
  OptionMarketPricer immutable internal optionPricer;
  OptionGreekCache immutable internal greekCache;
  IERC20 internal quoteAsset;
  IERC20 internal baseAsset;
  BasicFeeCounter immutable internal feeCounter;

/**
   * @dev Assigns all lyra contracts
   * @param _curveSwap Curve pool address
   * @param _optionToken OptionToken Address
   * @param _optionMarket OptionMarket Address
   * @param _liquidityPool LiquidityPool address
   * @param _shortCollateral ShortCollateral address
   * @param _synthetixAdapter SynthetixAdapter address
   * @param _optionPricer OptionMarketPricer address
   * @param _greekCache greekCache address
   * @param _feeCounter Fee counter address
 */
  constructor(
    address _curveSwap,
    address _optionToken,
    address _optionMarket,
    address _liquidityPool,
    address _shortCollateral,
    address _synthetixAdapter,
    address _optionPricer,
    address _greekCache,
    address _feeCounter
  ) {
    curveSwap = ICurve(_curveSwap);
    optionToken = OptionToken(_optionToken);
    optionMarket = OptionMarket(_optionMarket);
    liquidityPool = LiquidityPool(_liquidityPool);
    shortCollateral = ShortCollateral(_shortCollateral);
    synthetixAdapter = SynthetixAdapter(_synthetixAdapter);
    optionPricer = OptionMarketPricer(_optionPricer);
    greekCache = OptionGreekCache(_greekCache);
    feeCounter = BasicFeeCounter(_feeCounter);
  }

  /**
  * @dev
  * @param _quoteAsset Quote asset address
  * @param _baseAsset Base asset address
  */
  function baseInitialize (
    address _owner,
    address _quoteAsset,
    address _baseAsset
  ) internal initializer {
    __Ownable_init();
    transferOwnership(_owner);

    if (address(quoteAsset) != address(0)) {
      quoteAsset.approve(address(optionMarket), 0);
    }
    if (address(baseAsset) != address(0)) {
      baseAsset.approve(address(optionMarket), 0);
    }

    quoteAsset = IERC20(_quoteAsset);
    baseAsset = IERC20(_baseAsset);

    // Do approvals
    quoteAsset.approve(address(optionMarket), type(uint).max);
    baseAsset.approve(address(optionMarket), type(uint).max);
  }

  ////////////////////
  // Market Actions //
  ////////////////////

  // setTrustedCounter must be set for approved addresses
  function openPosition(TradeInputParameters memory params) internal returns (TradeResult memory) {
    OptionMarket.TradeInputParameters memory convertedParams = _convertParams(params); 
    OptionMarket.Result memory result = optionMarket.openPosition(convertedParams);

    if (params.rewardRecipient != address(0)) {
      feeCounter.addFees(address(optionMarket), params.rewardRecipient, result.totalFee);
    }
    return TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
  }

  function closePosition(TradeInputParameters memory params) internal returns (TradeResult memory) {
    OptionMarket.Result memory result = optionMarket.closePosition(_convertParams(params));
    if (params.rewardRecipient != address(0)) {
      feeCounter.addFees(address(optionMarket), params.rewardRecipient, result.totalFee);
    }
    return TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
  }

  function forceClosePosition(TradeInputParameters memory params) internal returns (TradeResult memory) {
    OptionMarket.Result memory result = optionMarket.forceClosePosition(_convertParams(params));
    if (params.rewardRecipient != address(0)) {
      feeCounter.addFees(address(optionMarket), params.rewardRecipient, result.totalFee);
    }
    return TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
  }

  //////////////
  // Exchange //
  //////////////

  function exchangeFromExactQuote(uint amountQuote, uint minBaseReceived) internal returns (uint baseReceived) {
    baseReceived = synthetixAdapter.exchangeFromExactQuote(address(optionMarket), amountQuote);
    require(baseReceived >= minBaseReceived, "base received too low");
  }

  function exchangeToExactQuote(uint amountQuote, uint maxBaseUsed) internal returns (uint quoteReceived) {
    SynthetixAdapter.ExchangeParams memory exchangeParams = synthetixAdapter.getExchangeParams(address(optionMarket));
    uint baseNeeded = synthetixAdapter.estimateExchangeForExactQuote(exchangeParams, amountQuote);
    require(maxBaseUsed >= baseNeeded, "not enough base");
    quoteReceived = synthetixAdapter.exchangeFromExactBase(address(optionMarket), baseNeeded);
  }

  function exchangeFromExactBase(uint amountBase, uint minQuoteReceived) internal returns (uint quoteReceived) {
    quoteReceived = synthetixAdapter.exchangeFromExactBase(address(optionMarket), amountBase);
    require(quoteReceived >= minQuoteReceived, "quote received too low");
  }

  function exchangeToExactBase(uint amountBase, uint maxQuoteUsed) internal returns (uint baseReceived) {
    SynthetixAdapter.ExchangeParams memory exchangeParams = synthetixAdapter.getExchangeParams(address(optionMarket));
    uint quoteNeeded = synthetixAdapter.estimateExchangeForExactBase(exchangeParams, amountBase);
    require(maxQuoteUsed >= quoteNeeded, "not enough quote");
    baseReceived = synthetixAdapter.exchangeForExactBase(exchangeParams, address(optionMarket), amountBase);
  }

  function swapStables(
    address from,
    address to,
    uint amount,
    uint expected,
    address receiver
  ) internal returns (uint amountOut, int swapFee) {
    int balStart = int(IERC20(from).balanceOf(address(this)));
    amountOut = curveSwap.exchange_with_best_rate(from, to, amount, expected, receiver);
    int balEnd = int(IERC20(from).balanceOf(address(this)));
    swapFee = balStart - balEnd - int(amountOut);
  }

  //////////////////////////
  // Option Token Actions //
  //////////////////////////

  // option token spilt
  function splitPosition(
    uint positionId,
    uint newAmount,
    uint newCollateral,
    address recipient
  ) internal returns (uint newPositionId) {
    newPositionId = optionToken.split(positionId, newAmount, newCollateral, recipient);
  }

  // option token merge
  function mergePositions(uint[] memory positionIds) internal {
    optionToken.merge(positionIds);
  }

  ////////////////////
  // Market Getters //
  ////////////////////

  function getLiveBoards() internal view returns (uint[] memory liveBoards) {
    liveBoards = optionMarket.getLiveBoards();
  }

  // get all board related info (non GWAV)
  function getBoard(uint boardId) internal view returns (Board memory) {
    OptionMarket.OptionBoard memory board = optionMarket.getOptionBoard(boardId);
    return Board({id: board.id, expiry: board.expiry, boardIv: board.iv, strikeIds: board.strikeIds});
  }

  // get all strike related info (non GWAV)
  function getStrikes(uint[] memory strikeIds) internal view returns (Strike[] memory allStrikes) {
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
  function getVols(uint[] memory strikeIds) internal view returns (uint[] memory vols) {
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
  function getDeltas(uint[] memory strikeIds) internal view returns (int[] memory callDeltas) {
    callDeltas = new int[](strikeIds.length);
    for (uint i = 0; i < strikeIds.length; i++) {
      BlackScholes.BlackScholesInputs memory bsInput = _getBsInput(strikeIds[i]);
      (callDeltas[i], ) = BlackScholes.delta(bsInput);
    }
  }

  function getVegas(uint[] memory strikeIds) internal view returns (uint[] memory vegas) {
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
  ) internal view returns (uint call, uint put) {
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
    SynthetixAdapter.ExchangeParams memory exchangeParams = synthetixAdapter.getExchangeParams(address(optionMarket));
    freeLiquidity = liquidityPool.getLiquidity(exchangeParams.spotPrice, exchangeParams.short).freeLiquidity;
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

  function _convertParams(TradeInputParameters memory _params)
    internal
    pure
    returns (OptionMarket.TradeInputParameters memory)
  {
    return
      OptionMarket.TradeInputParameters({
        strikeId: _params.strikeId,
        positionId: _params.positionId,
        iterations: _params.iterations,
        optionType: OptionMarket.OptionType(uint(_params.optionType)),
        amount: _params.amount,
        setCollateralTo: _params.setCollateralTo,
        minTotalCost: _params.minTotalCost,
        maxTotalCost: _params.maxTotalCost
      });
  }
}
