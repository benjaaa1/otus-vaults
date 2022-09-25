//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import "../../synthetix/SafeDecimalMath.sol";

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LyraAdapter} from "../../vaultAdapters/LyraAdapter.sol";
// import {FuturesAdapter} from "../../vaultAdapters/FuturesAdapter.sol";
import "../../interfaces/IFuturesMarket.sol";

/**
 * @title StrategyBase
 * @author Lyra
 * @dev Maintains strategy settings and strike validations
 */
contract StrategyBase is LyraAdapter {
  using SafeDecimalMath for uint;

  ///////////////
  // Variables //
  ///////////////

  IFuturesMarket internal futuresMarket;
  GWAVOracle public gwavOracle;

  IERC20 internal quoteAsset;

  uint public activeExpiry;
  uint public activeBoardId;
  uint[] public activeStrikeIds;

  StrikeTrade[] public currentStrikeTrades;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public strikeIdToTrade;

  mapping(uint => uint) public lastTradeTimestamp;
  mapping(uint => uint) public lastTradeOptionType;

  // Round vault settings
  StrategyDetail public currentStrategy;
  // dynamic hedge strategy
  DynamicDeltaHedgeStrategy public dynamicHedgeStrategy;
  // dynamic hedge strategy
  StaticDeltaHedgeStrategy public staticHedgeStrategy;

  // option type => strike strategy
  mapping(uint => StrikeStrategyDetail) public currentStrikeStrategies;

  HEDGETYPE public hedgeType;

  // hedge type selected
  enum HEDGETYPE {
    NO_HEDGE,
    SIMPLE_HEDGE,
    STATIC_DELTA_HEDGE,
    DYNAMIC_DELTA_HEDGE
  }

  // strategies can be updated by different strategizers
  struct StrategyDetail {
    uint hedgeReserve; // (this is subtracted first the collatpercent and buffer)
    uint collatBuffer;
    uint collatPercent;
    uint minTimeToExpiry;
    uint maxTimeToExpiry;
    uint minTradeInterval;
    uint gwavPeriod;
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
    uint optionType;
    uint strikeId;
    uint size;
  }

  struct StaticDeltaHedgeStrategy {
    uint deltaToHedge; // 50% - 100% -> dependent on risk appetite
    uint maxLeverageSize; // 150% ~ 1.5x 200% 2x
  }

  struct DynamicDeltaHedgeStrategy {
    uint deltaToHedge; // 50% - 100% -> dependent on risk appetite
    uint maxHedgeAttempts; // ~6 dependent on fees mostly
    uint maxLeverageSize; // 150% ~ 1.5x 200% 2x - sometimes not enough funds to cover the delta
    uint period; // 4 hours 12 hours 24 hours hedge attempt allowed once per period
  }

  constructor(address _synthetixAdapter) LyraAdapter(_synthetixAdapter) {}

  /**
   * @dev
   * @param _owner _owner address
   * @param _vault _vault address
   * @param marketAddresses marketAddresses
   * @param _currentStrategy strategy settings
   */
  function baseInitialize(
    address _owner,
    address _vault,
    address[] memory marketAddresses,
    StrategyDetail memory _currentStrategy
  ) internal {
    gwavOracle = GWAVOracle(marketAddresses[9]);
    currentStrategy = _currentStrategy;

    address _futuresMarket = marketAddresses[8];
    futuresMarket = IFuturesMarket(_futuresMarket);

    address _optionMarket = marketAddresses[3]; // marketAddress.optionMarket, allow for multiple option markets?
    address _quoteAsset = marketAddresses[0]; // quote asset

    if (address(quoteAsset) != address(0)) {
      quoteAsset.approve(_optionMarket, 0);
      quoteAsset.approve(_optionMarket, 0);
    }

    quoteAsset = IERC20(_quoteAsset);

    // Do approvals
    quoteAsset.approve(_vault, type(uint).max);

    quoteAsset.approve(_optionMarket, type(uint).max);

    quoteAsset.approve(_futuresMarket, type(uint).max);

    // susd test on synthetix different than lyra
    // IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57).approve(_futuresMarket, type(uint).max);

    // futuresInitialize(marketAddresses[8]);

    // instead of setting this here we can query for market addresses from trade function to otus controller registry
    // and use an interface to interact with these
    // to support multiple assets in vault
    // we will only store option market

    // struct MarketAddress {
    //   address liquidityPool
    //   address optionMarket
    //   address ...
    // }

    // mapping(bytes32 || option marekt address => MarketAddress) marketAddresses

    // IOtusController.MarketAddress marketAddress = IOtusController(otusControllerAddress).getMarketAddresses(bytes32);

    optionInitialize(
      _owner,
      marketAddresses[2], // marketAddress.optionToken,
      marketAddresses[3], // marketAddress.optionMarket,
      marketAddresses[4], // marketAddress.liquidityPool,
      marketAddresses[5], // marketAddress.shortCollateral,
      marketAddresses[6], // optionPricer
      marketAddresses[7] // greekCache
    );
  }

  //////////////////////////////
  // Active Strike Management //
  //////////////////////////////

  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveStrike(
    uint strikeId,
    uint tradedPositionId,
    uint currentStrikeTradeIndex
  ) internal {
    if (!_isActiveStrike(strikeId)) {
      strikeToPositionId[strikeId] = tradedPositionId;
      strikeIdToTrade[strikeId] = currentStrikeTradeIndex;
      activeStrikeIds.push(strikeId);
    }
  }

  /**
   * @dev remove position data opened in the current round.
   * this can only be called after the position is settled by lyra
   **/
  function _clearAllActiveStrikes() internal {
    if (activeStrikeIds.length != 0) {
      for (uint i = 0; i < activeStrikeIds.length; i++) {
        uint strikeId = activeStrikeIds[i];
        OptionPosition memory position = getPositions(_toDynamic(strikeToPositionId[strikeId]))[0];
        // revert if position state is not settled
        require(position.state != PositionState.ACTIVE, "cannot clear active position");
        delete strikeToPositionId[strikeId];
        delete strikeIdToTrade[strikeId];
        delete lastTradeTimestamp[i];
        delete lastTradeOptionType[i];
      }
      delete activeStrikeIds;
      delete currentStrikeTrades;
    }
  }

  function _clearCurrentStrikeTrades() public {
    delete currentStrikeTrades;
  }

  function _isActiveStrike(uint strikeId) internal view returns (bool isActive) {
    isActive = strikeToPositionId[strikeId] != 0;
  }

  function validateTimeIntervalByOptionType(uint strikeId, uint _optionType) internal view returns (bool) {
    bool valid = true;

    if (
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp &&
      lastTradeOptionType[strikeId] == _optionType + 1
    ) {
      valid = false;
    }

    return valid;
  }

  //////////////////
  // View Strikes //
  //////////////////

  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function isValidStrike(Strike memory strike, uint optionType) public view returns (bool isValid) {
    if (activeExpiry != strike.expiry) {
      return false;
    }

    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = getVols(strikeId)[0];
    int callDelta = getDeltas(strikeId)[0];
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
  function _isValidVolVariance(uint strikeId, uint optionType) internal view returns (bool isValid) {
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[optionType];

    uint volGWAV = gwavOracle.volGWAV(strikeId, currentStrategy.gwavPeriod);
    uint volSpot = getVols(_toDynamic(strikeId))[0];

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

  function _getFullCollateral(
    uint strikePrice,
    uint amount,
    uint _optionType
  ) internal pure returns (uint fullCollat) {
    // calculate required collat based on collatBuffer and collatPercent
    fullCollat = _isBaseCollat(_optionType) ? amount : amount.multiplyDecimal(strikePrice);
  }

  /**
   * @dev get amount of collateral needed for shorting {amount} of strike, according to the strategy
   */
  function _getBufferCollateral(
    uint strikePrice,
    uint expiry,
    uint spotPrice,
    uint amount,
    uint _optionType
  ) internal view returns (uint) {
    uint minCollat = getMinCollateral(OptionType(_optionType), strikePrice, expiry, spotPrice, amount);
    require(minCollat > 0, "min collat must be more");
    uint minCollatWithBuffer = minCollat.multiplyDecimal(currentStrategy.collatBuffer);

    uint fullCollat = _getFullCollateral(strikePrice, amount, _optionType);
    require(fullCollat > 0, "fullCollat collat must be more");

    return _min(minCollatWithBuffer, fullCollat);
  }

  function _getPremiumLimit(
    Strike memory strike,
    bool isMin,
    StrikeTrade memory trade
  ) public view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    StrikeStrategyDetail memory currentStrikeStrategy = currentStrikeStrategies[trade.optionType];

    uint limitVol = isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
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
  function _isOutsideDeltaCutoff(uint strikeId) internal view returns (bool) {
    MarketParams memory marketParams = getMarketParams();
    int callDelta = getDeltas(_toDynamic(strikeId))[0];
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
