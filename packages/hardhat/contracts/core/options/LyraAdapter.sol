//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

// Libraries
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {BlackScholes} from "@lyrafinance/protocol/contracts/libraries/BlackScholes.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";
import "../../synthetix/SignedSafeMath.sol";
import "../../synthetix/SignedSafeDecimalMath.sol";

// Inherited
import {SynthetixHedgeExtension} from "./SynthetixHedgeExtension.sol";
import {BaseHedgeExtension} from "./BaseHedgeExtension.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interfaces
import "../../interfaces/synthetix/IFuturesMarket.sol";
import "../../interfaces/ILyraBase.sol";
import {IOptionMarket} from "@lyrafinance/protocol/contracts/interfaces/IOptionMarket.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title LyraAdapter
 * @author Lyra
 * @dev cloned for each strategy to interact with lyra markets
 */
contract LyraAdapter is SynthetixHedgeExtension {
  // can use different decimal math not synthetix
  using SafeMath for uint;
  using SafeDecimalMath for uint;
  using SignedSafeMath for int;
  using SignedSafeDecimalMath for int;

  enum OrderTypes {
    MARKET,
    LIMIT
  }

  struct StrategyDetail {
    uint hedgeReserve;
    uint collatBuffer;
    uint collatPercent;
    uint minTimeToExpiry;
    uint maxTimeToExpiry;
    uint minTradeInterval;
    uint gwavPeriod;
    bytes32[] allowedMarkets;
  }

  struct StrikeStrategyDetail {
    int targetDelta;
    uint maxDeltaGap;
    uint minVol;
    uint maxVol;
    uint maxVolVariance;
    uint optionType;
  }

  struct StrikeTrade {
    bytes32 market;
    uint optionType;
    uint strikeId;
    uint size;
    uint positionId;
    uint targetPrice;
    // supports limit orders
    OrderTypes orderType;
  }

  struct Strike {
    uint id;
    uint expiry;
    uint strikePrice;
    uint skew;
    uint boardIv;
  }

  enum OptionType {
    LONG_CALL,
    LONG_PUT,
    SHORT_CALL_BASE,
    SHORT_CALL_QUOTE,
    SHORT_PUT_QUOTE
  }

  // enum PositionState {
  //   EMPTY,
  //   ACTIVE,
  //   CLOSED,
  //   LIQUIDATED,
  //   SETTLED,
  //   MERGED
  // }

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

  /************************************************
   *  ERRORS
   ***********************************************/
  /// @notice no trade found for positionid
  error NoActiveTradeForPositionId(uint _positionId);

  /************************************************
   *  STORED CONTRACT ADDRESSES
   ***********************************************/
  // set at deploy to include all available lyra option markets in chain
  mapping(bytes32 => address) public lyraOptionMarkets;

  // set on init copied from outscontroller (lyra base by market)
  mapping(bytes32 => ILyraBase) public lyraBases;

  // susd is used for quoteasset
  IERC20 internal immutable quoteAsset;

  /************************************************
   *  STRATEGY POSITION STATE
   ***********************************************/

  // trades by position id for current round
  mapping(uint => StrikeTrade) public tradeByPositionId;

  // all position ids for current round
  uint[] public positionIds;

  // vault strategy settings - can be updated when round is closed
  StrategyDetail public currentStrategy;

  // strike strategy settings by option type
  mapping(uint => StrikeStrategyDetail) public currentStrikeStrategies;

  constructor(address _quoteAsset) {
    quoteAsset = IERC20(_quoteAsset);
  }

  /**
   * @notice initialize ownership
   * @param _markets _owner
   * @param _lyraBases _owner
   * @param _lyraOptionMarkets _owner
   */
  function lyraInitialize(
    bytes32[] memory _markets,
    address[] memory _lyraBases,
    address[] memory _lyraOptionMarkets
  ) internal {
    uint len = _markets.length;

    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address _lyraBase = _lyraBases[i];
      address optionMarket = _lyraOptionMarkets[i];

      lyraBases[key] = ILyraBase(_lyraBase);
      lyraOptionMarkets[key] = optionMarket;
    }
  }

  /************************************************
   *  Market Position Actions
   ***********************************************/

  function _closePositions() internal {
    // get positions
    // similar to reduce positions
  }

  /**
   * @notice open a position in lyra mm
   * @param params params to open trade on lyra
   * @return result of opening trade
   */
  function openPosition(
    bytes32 market,
    TradeInputParameters memory params
  ) internal returns (TradeResult memory) {
    address optionMarket = lyraOptionMarkets[market];
    IOptionMarket.TradeInputParameters memory convertedParams = _convertParams(params);
    IOptionMarket.Result memory result = IOptionMarket(optionMarket).openPosition(convertedParams);

    return
      TradeResult({
        positionId: result.positionId,
        totalCost: result.totalCost,
        totalFee: result.totalFee
      });
  }

  /**
   * @notice close a position in lyra mm
   * @param params params to close trade on lyra
   * @return result of trade
   */
  function closePosition(
    bytes32 market,
    TradeInputParameters memory params
  ) internal returns (TradeResult memory) {
    address optionMarket = lyraOptionMarkets[market];

    IOptionMarket.Result memory result = IOptionMarket(optionMarket).closePosition(
      _convertParams(params)
    );

    return
      TradeResult({
        positionId: result.positionId,
        totalCost: result.totalCost,
        totalFee: result.totalFee
      });
  }

  /**
   * @notice forceclose a position in lyra mm
   * @param params params to close trade on lyra
   * @return result of trade
   */
  function forceClosePosition(
    bytes32 market,
    TradeInputParameters memory params
  ) internal returns (TradeResult memory) {
    address optionMarket = lyraOptionMarkets[market];

    IOptionMarket.Result memory result = IOptionMarket(optionMarket).forceClosePosition(
      _convertParams(params)
    );

    return
      TradeResult({
        positionId: result.positionId,
        totalCost: result.totalCost,
        totalFee: result.totalFee
      });
  }

  /************************************************
   *  Active Strike Information
   ***********************************************/

  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveTrade(StrikeTrade memory _newTrade, uint _positionId) internal {
    // check if strike/trade
    (bool _isActive, StrikeTrade memory _activeTrade) = _isActiveStrike(_positionId);
    if (_isActive) {
      // need to update size somewhere
      tradeByPositionId[_positionId] = _activeTrade; // update using storage
    } else {
      tradeByPositionId[_positionId] = _newTrade;
      positionIds.push(_positionId);
    }
  }

  /**
   * @notice add strike id to activeStrikeIds array
   * @param _positionId id to check
   * @return _isActive
   * @return _trade struct
   */
  function _isActiveStrike(
    uint _positionId
  ) internal view returns (bool _isActive, StrikeTrade memory _trade) {
    _trade = _getTradeByPoisitionId(_positionId);
    if (_trade.positionId == 0) {
      _isActive = false;
    }
    return (_isActive, _trade);
  }

  /**
   * @notice get trade by positionid
   * @param _positionId id to check
   * @return _trade struct
   */
  function _getTradeByPoisitionId(
    uint _positionId
  ) internal view returns (StrikeTrade memory _trade) {
    _trade = tradeByPositionId[_positionId];
  }

  /**
   * @notice get trades by market key
   * @param key market in bytes32
   * @return _strikeTrades struct[]
   */
  function _getTradeByMarketKey(
    bytes32 key
  ) internal view returns (StrikeTrade[] memory _strikeTrades) {
    for (uint i = 0; i < positionIds.length; i++) {
      uint counter;
      StrikeTrade memory _trade = _getTradeByPoisitionId(positionIds[i]);
      if (_trade.market == key) {
        counter++;
        _strikeTrades[counter] = _trade;
      }
    }
  }

  /**
   * @notice checks selected strike with current strategy
   * @param _trade trade
   * @return isValid
   * @return strike
   * @dev move to lyraBase?
   */
  function _getValidStrike(
    StrikeTrade memory _trade
  ) public view returns (bool isValid, ILyraBase.Strike memory strike) {
    isValid = true;

    // require(
    //   _isValidVolVariance(_trade.market, _trade.strikeId, _trade.optionType),
    //   "vol variance exceeded"
    // );
    if (!_isValidVolVariance(_trade.market, _trade.strikeId, _trade.optionType)) {
      return (isValid, strike);
    }

    // require(_isValidStrike(_trade.market, _trade.strikeId, _trade.optionType), "invalid strike");
    if (!_isValidStrike(_trade.market, _trade.strikeId, _trade.optionType)) {
      return (isValid, strike);
    }

    strike = lyraBase(_trade.market).getStrikes(_toDynamic(_trade.strikeId))[0];

    // require(_isValidExpiry(strike.expiry), "not valid expiry");
    if (!_isValidExpiry(strike.expiry)) {
      return (isValid, strike);
    }

    return (isValid, strike);
  }

  function _isValidStrike(
    bytes32 market,
    uint _strikeId,
    uint optionType
  ) public view returns (bool isValid) {
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint[] memory strikeId = _toDynamic(_strikeId);
    uint vol = lyraBase(market).getVols(strikeId)[0];
    int callDelta = lyraBase(market).getDeltas(strikeId)[0];
    int delta = _isCall(currentStrikeStrategy.optionType)
      ? callDelta
      : callDelta - SignedDecimalMath.UNIT;
    uint deltaGap = _abs(currentStrikeStrategy.targetDelta - delta);

    return
      vol >= currentStrikeStrategy.minVol &&
      vol <= currentStrikeStrategy.maxVol &&
      deltaGap < currentStrikeStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(
    bytes32 market,
    uint strikeId,
    uint optionType
  ) internal view returns (bool isValid) {
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint volGWAV = lyraBase(market).volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = lyraBase(market).getVols(_toDynamic(strikeId))[0];
    uint volDiff = (volGWAV >= volSpot) ? volGWAV - volSpot : volSpot - volGWAV;
    return isValid = volDiff < currentStrikeStrategy.maxVolVariance;
  }

  /**
   * @dev check if the expiry of the board is valid according to the strategy
   */
  function _isValidExpiry(uint expiry) internal view returns (bool isValid) {
    uint secondsToExpiry = _getSecondsToExpiry(expiry);

    isValid = (secondsToExpiry >= currentStrategy.minTimeToExpiry &&
      secondsToExpiry <= currentStrategy.maxTimeToExpiry);
  }

  /************************************************
   *  Clear strikes - End of Round
   ***********************************************/

  /**
   * @notice clears strikes at end of round
   */
  function _clearRoundStrikes() internal {
    for (uint i = 0; i < positionIds.length; i++) {
      delete tradeByPositionId[positionIds[i]];
    }
    delete positionIds;
  }

  /************************************************
   *  Trade Collateral Helpers
   ***********************************************/

  /**
   * @notice calculate required collateral to add in the next trade.
   * only add collateral if the additional sell will make the position out of buffer range
   * never remove collateral from an existing position
   * @param _trade strike trade
   * @param _strikeExpiry expiry
   * @return collateralToAdd
   * @return setCollateralTo
   */
  function getRequiredCollateral(
    StrikeTrade memory _trade,
    uint _strikePrice,
    uint _strikeExpiry
  ) public view returns (uint collateralToAdd, uint setCollateralTo) {
    ILyraBase.ExchangeRateParams memory exchangeParams = lyraBase(_trade.market)
      .getExchangeParams();

    // get existing position info if active
    uint existingAmount;
    uint existingCollateral;

    (bool _isActive, ) = _isActiveStrike(_trade.positionId);

    if (_isActive) {
      ILyraBase.OptionPosition memory position = lyraBase(_trade.market).getPositions(
        _toDynamic(_trade.positionId)
      )[0];
      existingCollateral = position.collateral;
      existingAmount = position.amount;
    }
    // gets minBufferCollat for the whole position
    uint minBufferCollateral = lyraBase(_trade.market)._getBufferCollateral(
      _strikePrice,
      _strikeExpiry,
      exchangeParams.spotPrice,
      existingAmount + _trade.size,
      _trade.optionType,
      currentStrategy.collatBuffer
    );
    // get targetCollat for this trade instance
    // prevents vault from adding excess collat just to meet targetCollat
    uint targetCollat = _getTargetCollateral(existingCollateral, _strikePrice, _trade);

    // if excess collateral, keep in position to encourage more option selling
    setCollateralTo = _max(_max(minBufferCollateral, targetCollat), existingCollateral);

    // existingCollateral is never > setCollateralTo
    collateralToAdd = setCollateralTo - existingCollateral;
  }

  /************************************************
   *  Collateral Check Helpers
   ***********************************************/

  /**
   * @notice gets target collateral
   * @param _existingCollateral collateral existing for position
   * @param _strikePrice strike price
   * @param _trade trade info
   * @return targetCollat
   */
  function _getTargetCollateral(
    uint _existingCollateral,
    uint _strikePrice,
    StrikeTrade memory _trade
  ) internal view returns (uint targetCollat) {
    targetCollat =
      _existingCollateral +
      lyraBase(_trade.market)
        ._getFullCollateral(_strikePrice, _trade.size, _trade.optionType)
        .multiplyDecimal(currentStrategy.collatPercent);
  }

  /**
   * @notice get allowed close amount
   * @dev calculates the position amount required to stay above the buffer collateral
   * @param _market market btc / eth
   * @param _positionAmount current position size
   * @param _positionCollateral current collateral for position
   * @param _strikePrice strike price
   * @param _strikeExpiry strike expiry
   * @param _optionType option type
   */
  function getAllowedCloseAmount(
    bytes32 _market,
    uint _positionAmount,
    uint _positionCollateral,
    uint _strikePrice,
    uint _strikeExpiry,
    uint _optionType
  ) public view returns (uint closeAmount) {
    ILyraBase.ExchangeRateParams memory exchangeParams = lyraBase(_market).getExchangeParams();
    uint minCollatPerAmount = lyraBase(_market)._getBufferCollateral(
      _strikePrice,
      _strikeExpiry,
      exchangeParams.spotPrice,
      1e18,
      _optionType,
      currentStrategy.collatBuffer
    );

    closeAmount = _positionCollateral < minCollatPerAmount.multiplyDecimal(_positionAmount)
      ? _positionCollateral - _positionCollateral.divideDecimal(minCollatPerAmount)
      : 0;
  }

  /************************************************
   *  Trade Premium Check
   ***********************************************/
  /**
   * @notice get premium/price limit
   * @param _trade lyra strike details to trade
   * @param _expiry lyra strike details to trade
   * @param _strikePrice lyra strike details to trade
   * @param _isMin lyra strike details to trade
   * @return limitPremium
   */
  function _getPremiumLimit(
    StrikeTrade memory _trade,
    uint _expiry,
    uint _strikePrice,
    bool _isMin
  ) public view returns (uint limitPremium) {
    ILyraBase.ExchangeRateParams memory exchangeParams = lyraBase(_trade.market)
      .getExchangeParams();
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[_trade.optionType];

    uint limitVol = _isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;

    (uint minCallPremium, uint minPutPremium) = lyraBase(_trade.market).getPurePremium(
      _getSecondsToExpiry(_expiry),
      limitVol,
      exchangeParams.spotPrice,
      _strikePrice
    );

    limitPremium = _isCall(_trade.optionType)
      ? minCallPremium.multiplyDecimal(_trade.size)
      : minPutPremium.multiplyDecimal(_trade.size);
  }

  /************************************************
   *  Misc
   ***********************************************/

  function _convertParams(
    TradeInputParameters memory _params
  ) internal pure returns (IOptionMarket.TradeInputParameters memory) {
    return
      IOptionMarket.TradeInputParameters({
        strikeId: _params.strikeId,
        positionId: _params.positionId,
        iterations: _params.iterations,
        optionType: IOptionMarket.OptionType(uint(_params.optionType)),
        amount: _params.amount,
        setCollateralTo: _params.setCollateralTo,
        minTotalCost: _params.minTotalCost,
        maxTotalCost: _params.maxTotalCost
      });
  }

  function _isCall(uint _optionType) public pure returns (bool isCall) {
    isCall = (OptionType(_optionType) == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _isLong(uint _optionType) public pure returns (bool isLong) {
    if (
      OptionType(_optionType) == OptionType.LONG_CALL ||
      OptionType(_optionType) == OptionType.LONG_PUT
    ) {
      isLong = true;
    }
  }

  function _getSecondsToExpiry(uint expiry) internal view returns (uint) {
    require(block.timestamp <= expiry, "timestamp expired");
    return expiry - block.timestamp;
  }

  function _abs(int val) internal pure returns (uint) {
    return val >= 0 ? uint(val) : uint(-val);
  }

  function _max(uint x, uint y) internal pure returns (uint) {
    return (x > y) ? x : y;
  }

  // temporary fix - eth core devs promised Q2 2022 fix
  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }

  /************************************************
   *  Internal Lyra Base Getter
   ***********************************************/

  function lyraBase(bytes32 market) internal view returns (ILyraBase) {
    require(address(lyraBases[market]) != address(0), "LyraBase: Not available");
    return lyraBases[market];
  }
}
