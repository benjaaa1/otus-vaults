//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import './synthetix/SafeDecimalMath.sol';

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VaultAdapter} from "./VaultAdapter.sol";
import {FuturesAdapter} from "./FuturesAdapter.sol";

/**
 * @title VaultAdapter 
 * @author Lyra
 * @dev LyraAdapter but inherits from OwnerUpgradable - Provides helpful functions for the vault adapter
 */

contract StrategyBase is FuturesAdapter, VaultAdapter {
  using SafeDecimalMath for uint;

  ///////////////
  // Variables //
  ///////////////

  GWAVOracle public gwavOracle;

  IERC20 internal quoteAsset;
  IERC20 internal baseAsset;

  uint public activeExpiry;
  uint public activeBoardId;

  uint[] public activeStrikeIds;
  mapping(uint => uint) public strikeToPositionId;
  mapping(uint => uint) public strategyToStrikeId;
  mapping(uint => uint) public lastTradeTimestamp;
  mapping(uint => uint) public lastTradeOptionType;

    // strategies can be updated by different strategizers
  struct StrategyDetail {
    uint collatBuffer; // slider - multiple of vaultAdapter.minCollateral(): 1.1 -> 110% * minCollat
    uint collatPercent; // slider - partial collateral: 0.9 -> 90% * fullCollat
    uint minTimeToExpiry; // slider 
    uint maxTimeToExpiry; // slider
    uint minTradeInterval; // slider
    uint gwavPeriod; // slider
  }

  struct StrikeStrategyDetail {
    int targetDelta; // slider
    uint maxDeltaGap; // slider
    uint minVol; // slider
    uint maxVol; // slider
    uint maxVolVariance; // slider
    uint optionType; 
    uint strikeId;
    uint size; 
  }

  struct HedgeDetail {
    uint hedgePercentage; // 20% + collatPercent == 100%
    uint maxHedgeAttempts; // ~6 dependent on fees mostly 
    uint limitStrikePricePercent; // .0005 = ex. strike price of 1750 .5% ~ 1758.75
    uint leverageSize; // 150% ~ 1.5x 200% 2x 
    uint stopLossLimit; // .001 1%
  }

  StrategyDetail public currentStrategy; // this wont change much 
  StrikeStrategyDetail[] public currentStrikeStrategies; // this will change every week possibly
  HedgeDetail public currentHedgeStrategy;

  constructor(address _synthetixAdapter) FuturesAdapter() VaultAdapter(_synthetixAdapter)  {}

  /**
  * @dev
  * @param _owner _owner address
  * @param _vault _vault address
  * @param marketAddresses marketAddresses
  */
  function baseInitialize (
    address _owner,
    address _vault,
    address[] memory marketAddresses,
    address _gwavOracle
  ) internal {

    gwavOracle = GWAVOracle(_gwavOracle);

    address _futuresMarket = marketAddresses[8]; 
    address _optionMarket = marketAddresses[3];	// marketAddress.optionMarket, 
    address _quoteAsset = marketAddresses[0];  // quote asset
    address _baseAsset = marketAddresses[1];  // base asset
    
    if (address(quoteAsset) != address(0)) {
      quoteAsset.approve(_optionMarket, 0);
      quoteAsset.approve(_optionMarket, 0);
    }
    if (address(baseAsset) != address(0)) {
      baseAsset.approve(_futuresMarket, 0);
      baseAsset.approve(_futuresMarket, 0);
    }

    quoteAsset = IERC20(_quoteAsset);
    baseAsset = IERC20(_baseAsset);

    // Do approvals
    quoteAsset.approve(_vault, type(uint).max);
    baseAsset.approve(_vault, type(uint).max);

    quoteAsset.approve(_optionMarket, type(uint).max);
    baseAsset.approve(_optionMarket, type(uint).max);

    quoteAsset.approve(_futuresMarket, type(uint).max);
    baseAsset.approve(_futuresMarket, type(uint).max);
    // susd test on synthetix different than lyra
    // IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57).approve(_futuresMarket, type(uint).max);

    futuresInitialize(marketAddresses[8]);

    optionInitialize(
      _owner,
      marketAddresses[2],	// marketAddress.optionToken,
      marketAddresses[3],	// marketAddress.optionMarket,
      marketAddresses[4],	// marketAddress.liquidityPool,
      marketAddresses[5],	// marketAddress.shortCollateral,
      marketAddresses[6],  // optionPricer
      marketAddresses[7]  // greekCache
    );

  }

  //////////////////////////////
  // Active Strike Management //
  //////////////////////////////

  /**
   * @dev add strike id to activeStrikeIds array
   */
  function _addActiveStrike(uint strikeId, uint tradedPositionId, uint currentStrategyDetailIndex) internal {
    if (!_isActiveStrike(strikeId)) {
      strikeToPositionId[strikeId] = tradedPositionId;
      strategyToStrikeId[strikeId] = currentStrategyDetailIndex;
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
        delete strategyToStrikeId[strikeId];
        delete lastTradeTimestamp[i];
        delete lastTradeOptionType[i];
      }
      delete activeStrikeIds;
      delete currentStrikeStrategies; 
    }
  }

  function _clearCurrentStrategyStrikes() public {
    delete currentStrikeStrategies; 
  }

  function _isActiveStrike(uint strikeId) internal view returns (bool isActive) {
    isActive = strikeToPositionId[strikeId] != 0;
  }

  
  function validateTimeIntervalByOptionType(uint strikeId, uint _optionType) internal view returns (bool) {
    
    bool valid = true; 

    if (
      lastTradeTimestamp[strikeId] + currentStrategy.minTradeInterval <= block.timestamp && 
      lastTradeOptionType[strikeId] == _optionType + 1) { 
        valid = false; 
    }

    return valid; 
  }


  //////////////////
  // View Strikes //
  //////////////////

  function getActiveStrikeIds() public view returns (uint[] memory) {
    return activeStrikeIds; 
  }

  /**
   * @dev verify if the strike is valid for the strategy
   * @return isValid true if vol is withint [minVol, maxVol] and delta is within targetDelta +- maxDeltaGap
   */
  function isValidStrike(Strike memory strike, StrikeStrategyDetail memory currentStrikeStrategy) public view returns (bool isValid) {
    if (activeExpiry != strike.expiry) {
      return false;
    }

    uint[] memory strikeId = _toDynamic(strike.id);
    uint vol = getVols(strikeId)[0];
    int callDelta = getDeltas(strikeId)[0];
    int delta = _isCall(currentStrikeStrategy.optionType) ? callDelta : callDelta - SignedDecimalMath.UNIT;
    uint deltaGap = _abs(currentStrikeStrategy.targetDelta - delta);

    return vol >= currentStrikeStrategy.minVol && vol <= currentStrikeStrategy.maxVol && deltaGap < currentStrikeStrategy.maxDeltaGap;
  }

  /**
   * @dev check if the vol variance for the given strike is within certain range
   */
  function _isValidVolVariance(uint strikeId, StrikeStrategyDetail memory currentStrikeStrategy) internal view returns (bool isValid) {
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

    isValid = (secondsToExpiry >= currentStrategy.minTimeToExpiry && secondsToExpiry <= currentStrategy.maxTimeToExpiry);
  }

   /////////////////////////////
  // Trade Parameter Helpers //
  /////////////////////////////

  function _getFullCollateral(uint strikePrice, uint amount, uint _optionType) internal view returns (uint fullCollat) {
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
      StrikeStrategyDetail memory currentStrikeStrategy
    ) public view returns (uint limitPremium) {
    ExchangeRateParams memory exchangeParams = getExchangeParams();
    uint limitVol = isMin ? currentStrikeStrategy.minVol : currentStrikeStrategy.maxVol;
    (uint minCallPremium, uint minPutPremium) = getPurePremium(
      _getSecondsToExpiry(strike.expiry),
      limitVol,
      exchangeParams.spotPrice,
      strike.strikePrice
    );

    limitPremium = _isCall(currentStrikeStrategy.optionType)
      ? minCallPremium.multiplyDecimal(currentStrikeStrategy.size)
      : minPutPremium.multiplyDecimal(currentStrikeStrategy.size);
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

  function _isBaseCollat(uint _optionType) internal view returns (bool isBase) {
    isBase = (OptionType(_optionType) == OptionType.SHORT_CALL_BASE) ? true : false;
  }

  function _isCall(uint _optionType) public view returns (bool isCall) {
    isCall = (OptionType(_optionType) == OptionType.SHORT_PUT_QUOTE) ? false : true;
  }

  function _isLong(uint _optionType) public view returns (bool isLong) {
    if(OptionType(_optionType) == OptionType.LONG_CALL ||  OptionType(_optionType) == OptionType.LONG_PUT) {
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
