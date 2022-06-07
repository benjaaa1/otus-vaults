//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

// Inherited
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VaultAdapter 
 * @author Lyra
 * @dev LyraAdapter but inherits from OwnerUpgradable - Provides helpful functions for the vault adapter
 */

contract TokenAdapter is OwnableUpgradeable {
  ///////////////
  // Variables //
  ///////////////

  IERC20 internal quoteAsset;
  IERC20 internal baseAsset;

  constructor() {}

  /**
  * @dev
  * @param _quoteAsset Quote asset address
  * @param _baseAsset Base asset address
  */
  function baseInitialize (
    address _owner,
    address _vault,
    address _futuresMarket,
    address _optionMarket,
    address _quoteAsset,
    address _baseAsset
  ) internal initializer {
    __Ownable_init();
    transferOwnership(_owner);
    
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
    IERC20(0xaA5068dC2B3AADE533d3e52C6eeaadC6a8154c57).approve(_futuresMarket, type(uint).max);
  }

}
