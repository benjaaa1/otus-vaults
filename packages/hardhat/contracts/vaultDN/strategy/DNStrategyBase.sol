//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import {SignedDecimalMath} from "@lyrafinance/protocol/contracts/synthetix/SignedDecimalMath.sol";
import {DecimalMath} from "@lyrafinance/protocol/contracts/synthetix/DecimalMath.sol";
import '../../synthetix/SafeDecimalMath.sol';

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ExchangeAdapter} from "../vaultAdapters/ExchangeAdapter.sol";
import {FuturesAdapter} from "../vaultAdapters/FuturesAdapter.sol";

/**
 * @title VaultAdapter 
 * @author Lyra
 * @dev LyraAdapter but inherits from OwnerUpgradable - Provides helpful functions for the vault adapter
 */

contract DNStrategyBase is FuturesAdapter, ExchangeAdapter {
  using SafeDecimalMath for uint;

  ///////////////
  // Variables //
  ///////////////

  IERC20 internal baseAsset; // sETH or sBTC
  IERC20 internal quoteAsset; // sUSD

  // strategies can be updated by different strategizers
  struct StrategyDetail {
    uint minCollateralPercent; // slider we'll use to calcualte leverage 
    uint rebalanceAttempts; // slider
    uint minRebalanceInterval; // slider
  }

  StrategyDetail public currentStrategy; // this wont change much 

  constructor(address _synthetixAdapter) FuturesAdapter() ExchangeAdapter(_synthetixAdapter)  {}

  /**
  * @dev
  * @param _owner _owner address
  * @param _vault _vault address
  */
  function baseInitialize (
    address _owner,
    address _vault,
    address[] memory marketAddresses,
    StrategyDetail memory _currentStrategy
  ) internal {

    currentStrategy = _currentStrategy;

    address _quoteAsset = marketAddresses[0];  // quote asset
    address _baseAsset = marketAddresses[1];  // base asset
    address _futuresMarket = marketAddresses[2]; 

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

    quoteAsset.approve(_exchange, type(uint).max);
    baseAsset.approve(_exchange, type(uint).max);

    quoteAsset.approve(_futuresMarket, type(uint).max);
    baseAsset.approve(_futuresMarket, type(uint).max);
    
    futuresInitialize(marketAddresses[2]);

  }

  /////////////////////////////
  // Trade Parameter Helpers //
  /////////////////////////////

  function _getCollateral(uint minCollateralPercent, uint allCapital) internal view returns 
    (
      uint spotCapital, 
      uint perpCapital, 
      uint leverageSize
    ) {

    spotCapital = allCapital.multiplyDecimal(minCollateralPercent); 
    uint perpCapitalWithoutLeverage = allCapital.sub(spotCapital); 
    leverageSize = spotCapital.divideDecimal(spotCapital); 
    perpCapital = perpCapitalWithoutLeverage.multiplyDecimal(leverageSize); 

  }

  //////////
  // Misc //
  //////////

  function _isPositiveFundingRate(int _fundingRate) public view returns (bool isLong) {
    return _fundingRate > 0; 
  }

  // temporary fix - eth core devs promised Q2 2022 fix
  function _toDynamic(uint val) internal pure returns (uint[] memory dynamicArray) {
    dynamicArray = new uint[](1);
    dynamicArray[0] = val;
  }
}
