//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Libraries
import {BlackScholes} from '@lyrafinance/protocol/contracts/libraries/BlackScholes.sol';
import {DecimalMath} from '@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol';

// Inherited
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

// Interfaces
import {IOptionMarket} from '@lyrafinance/protocol/contracts/interfaces/IOptionMarket.sol';

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

/**
 * @title LyraAdapter
 * @author Lyra
 * @dev cloned for each strategy to interact with lyra markets
 */
contract LyraAdapter is OwnableUpgradeable {
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

  // set at deploy to include all available lyra option markets in chain
  mapping(bytes32 => address) public lyraOptionMarkets;

  constructor() {}

  /**
   * @notice initialize ownership
   * @param _owner _owner
   */
  function lyraInitialize(address _owner) internal initializer {
    __Ownable_init();
    transferOwnership(_owner);
  }

  ////////////////////
  // Market Actions //
  ////////////////////

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
      TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
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

    IOptionMarket.Result memory result = IOptionMarket(optionMarket).closePosition(_convertParams(params));

    return
      TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
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
      TradeResult({positionId: result.positionId, totalCost: result.totalCost, totalFee: result.totalFee});
  }

  //////////
  // Misc //
  //////////

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
}
