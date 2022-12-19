//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";

// interfaces
import {IOptionMarket} from "@lyrafinance/protocol/contracts/interfaces/IOptionMarket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/ILyraBase.sol";
import "../../interfaces/IFuturesMarket.sol";
import "../../interfaces/IOtusController.sol";

// Inherited
import {LyraAdapter} from "../../vaultAdapters/LyraAdapter.sol";

/**
 * @title StrategyBase
 * @author Lyra
 * @dev Maintains strategy settings and strike validations
 */
contract StrategyBase is LyraAdapter {
  using SafeDecimalMath for uint;

  enum HEDGETYPE {
    NO_HEDGE,
    USER_HEDGE,
    DYNAMIC_DELTA_HEDGE
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
    uint strikePrice;
  }

  struct DynamicDeltaHedgeStrategy {
    int threshold; // if delta is .8 and threshold is .6 then reduce expoosure to .6 by making the .2 difference
    uint maxHedgeAttempts;
    uint maxLeverageSize;
  }

  ///////////////
  // Variables //
  ///////////////

  // otus controller
  IOtusController internal immutable otusController;

  // susd is used for quoteasset
  IERC20 internal immutable quoteAsset;

  // strike position management
  // keeps track of current strikes traded for round
  StrikeTrade[] public activeStrikeTrades;
  // mapping of strike to position id
  mapping(uint => StrikeTrade) public activeStrikeByPositionId;
  // position
  mapping(bytes32 => uint) public positionIdByStrikeOption;
  // strategy management
  // vault strategy settings - can be updated when round is closed
  StrategyDetail public currentStrategy;
  // strike strategy settings by option type
  mapping(uint => StrikeStrategyDetail) public currentStrikeStrategies;
  // dynamic hedge settings - can be updated when round is closed
  DynamicDeltaHedgeStrategy public dynamicHedgeStrategy;
  // hedge type strategy for vault (none, user, dynamic)
  HEDGETYPE public hedgeType;

  // set on init copied from outscontroller
  bytes32[] public markets;

  // set on init copied from outscontroller
  mapping(bytes32 => address) public lyraBases;

  // set on init copied from outscontroller
  mapping(bytes32 => address) public futuresMarketsByKey;

  // store allowed markets can be updated
  mapping(bytes32 => bool) public allowedMarkets;

  constructor(address _quoteAsset, address _otusController) LyraAdapter() {
    quoteAsset = IERC20(_quoteAsset);
    otusController = IOtusController(_otusController);
  }

  /**
   * @dev
   * @param _owner _owner address
   * @param _vault _vault address
   * @param _currentStrategy strategy settings
   */
  function baseInitialize(address _owner, address _vault, StrategyDetail memory _currentStrategy) internal {
    (
      bytes32[] memory _markets,
      address[] memory _lyraBases,
      address[] memory _futuresMarkets,
      address[] memory _lyraOptionMarkets
    ) = otusController._getMarketContracts();

    markets = _markets;
    // set initial market contracts
    uint len = _markets.length;

    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address lyraBase = _lyraBases[i];
      address futuresMarket = _futuresMarkets[i];
      address optionMarket = _lyraOptionMarkets[i];

      lyraBases[key] = lyraBase;
      futuresMarketsByKey[key] = futuresMarket;
      lyraOptionMarkets[key] = optionMarket;
    }

    // store initial vault strategy
    currentStrategy = _currentStrategy;
    // initial markets allowed by manager by name (eth btc...)
    _setAllowedMarkets(currentStrategy.allowedMarkets);

    quoteAsset.approve(_vault, type(uint).max);

    lyraInitialize(_owner);
  }

  //////////////////////////////
  // Set Additional Strategy //
  //////////////////////////////
  /**
   * @dev On init and strategy update / update markets allowed
   */
  function _setAllowedMarkets(bytes32[] memory managerAllowedMarkets) internal {
    uint len = managerAllowedMarkets.length;

    for (uint i = 0; i < len; i++) {
      bytes32 key = managerAllowedMarkets[i];
      allowedMarkets[key] = true;
      // allowedOptionMarket[key] = true;

      address optionMarket = lyraOptionMarkets[key];
      address futuresMarket = futuresMarketsByKey[key];

      quoteAsset.approve(address(optionMarket), type(uint).max);
      quoteAsset.approve(address(futuresMarket), type(uint).max);
    }
  }

  //////////////////////////////
  // Active Strike Management //
  //////////////////////////////

  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveStrike(StrikeTrade memory strike, uint tradedPositionId, uint optionType) internal {
    if (!_isActiveStrike(strike.strikeId, optionType)) {
      positionIdByStrikeOption[keccak256(abi.encode(strike.strikeId, optionType))] = tradedPositionId;
      activeStrikeByPositionId[tradedPositionId] = strike;
      activeStrikeTrades.push(strike);
    }
  }

  /**
   * @dev remove position data opened in the current round.
   * this can only be called after the position is settled by lyra
   **/
  function _clearAllActiveStrikes() internal {
    uint len = activeStrikeTrades.length;

    if (len != 0) {
      address lyraBase;
      StrikeTrade memory activeTrade;

      for (uint i = 0; i < len; i++) {
        activeTrade = activeStrikeTrades[i];
        lyraBase = lyraBases[activeTrade.market];
        // get position id on StrikeTrade?
        ILyraBase.OptionPosition memory position = ILyraBase(lyraBase).getPositions(_toDynamic(activeTrade.positionId))[
          0
        ];
        require(position.state != ILyraBase.PositionState.ACTIVE, "cannot clear active position");
        delete positionIdByStrikeOption[keccak256(abi.encode(activeTrade.strikeId, activeTrade.optionType))];
        delete activeStrikeByPositionId[activeTrade.positionId];
      }

      delete activeStrikeTrades;
      uint afterlen = activeStrikeTrades.length;
    }
  }

  //////////////////
  // View Strikes //
  //////////////////

  function _isActiveStrike(uint strikeId, uint optionType) internal view returns (bool isActive) {
    // mapping(uint => uint) memory strikeToPositionId = strikeToPositionIdByOptionType[optionType];
    // isActive = strikeToPositionId[strikeId] != 0;

    bytes32 key = keccak256(abi.encode(strikeId, optionType));
    uint positionId = positionIdByStrikeOption[key];
    isActive = positionId != 0 ? true : false;

    // StrikePosition memory strikePosition = optionTypePositions[optionType];
    // isActive = strikePosition.strikeToPositionId[strikeId] != 0 ? true : false;
  }

  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function _isValidStrike(
    address lyraBase,
    ILyraBase.Strike memory strike,
    uint optionType
  ) public view returns (bool isValid) {
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = ILyraBase(lyraBase).getVols(strikeId)[0];
    int callDelta = ILyraBase(lyraBase).getDeltas(strikeId)[0];
    int delta = _isCall(currentStrikeStrategy.optionType) ? callDelta : callDelta - SignedDecimalMath.UNIT;
    uint deltaGap = _abs(currentStrikeStrategy.targetDelta - delta);

    return
      vol >= currentStrikeStrategy.minVol &&
      vol <= currentStrikeStrategy.maxVol &&
      deltaGap < currentStrikeStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(address lyraBase, uint strikeId, uint optionType) internal view returns (bool isValid) {
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint volGWAV = ILyraBase(lyraBase).volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = ILyraBase(lyraBase).getVols(_toDynamic(strikeId))[0];
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

  /////////////////////////////
  // Trade Parameter Helpers //
  /////////////////////////////

  function _getFullCollateral(uint strikePrice, uint amount, uint _optionType) internal pure returns (uint fullCollat) {
    // calculate required collat based on collatBuffer and collatPercent
    fullCollat = _isBaseCollat(_optionType) ? amount : amount.multiplyDecimal(strikePrice);
  }

  /**
   * @dev get amount of collateral needed for shorting {amount} of strike, according to the strategy
   */
  function _getBufferCollateral(
    address lyraBase,
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount,
    uint _optionType
  ) internal view returns (uint) {
    uint minCollat = ILyraBase(lyraBase).getMinCollateral(
      ILyraBase.OptionType(_optionType),
      strikePrice,
      expiry,
      spotPrice,
      amount
    );
    require(minCollat > 0, "min collat must be more");
    uint minCollatWithBuffer = minCollat.multiplyDecimal(currentStrategy.collatBuffer);

    uint fullCollat = _getFullCollateral(strikePrice, amount, _optionType);
    require(fullCollat > 0, "fullCollat collat must be more");

    return _min(minCollatWithBuffer, fullCollat);
  }

  function _getPremiumLimit(
    address lyraBase,
    ILyraBase.Strike memory strike,
    bool isMin,
    StrikeTrade memory trade
  ) public view returns (uint limitPremium) {
    ILyraBase.ExchangeRateParams memory exchangeParams = ILyraBase(lyraBase).getExchangeParams();
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[trade.optionType];

    uint limitVol = isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = ILyraBase(lyraBase).getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall(trade.optionType)
      ? minCallPremium.multiplyDecimal(trade.size)
      : minPutPremium.multiplyDecimal(trade.size);
  }

  /**
   * @dev use latest optionMarket delta cutoff to determine whether trade delta is out of bounds
   */
  function _isOutsideDeltaCutoff(address lyraBase, uint strikeId) internal view returns (bool) {
    ILyraBase.MarketParams memory marketParams = ILyraBase(lyraBase).getMarketParams();
    int callDelta = ILyraBase(lyraBase).getDeltas(_toDynamic(strikeId))[0];
    return callDelta > (int(DecimalMath.UNIT) - marketParams.deltaCutOff) || callDelta < marketParams.deltaCutOff;
  }

  //////////
  // Misc //
  //////////

  function _isBaseCollat(uint _optionType) internal pure returns (bool isBase) {
    isBase = (OptionType(_optionType) == OptionType.SHORT_CALL_BASE) ? true : false;
  }

  function _isCall(uint _optionType) public pure returns (bool isCall) {
    isCall = (OptionType(_optionType) == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _isLong(uint _optionType) public pure returns (bool isLong) {
    if (OptionType(_optionType) == OptionType.LONG_CALL || OptionType(_optionType) == OptionType.LONG_PUT) {
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

  function _min(uint x, uint y) internal pure returns (uint) {
    return (x < y) ? x : y;
  }

  function _max(uint x, uint y) internal pure returns (uint) {
    return (x > y) ? x : y;
  }

  // temporary fix - eth core devs promised Q2 2022 fix
  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }
}
