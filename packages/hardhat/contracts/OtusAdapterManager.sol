//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {GWAVOracle} from "@lyrafinance/core/contracts/periphery/GWAVOracle.sol";
import {OtusAdapter} from "./OtusAdapter.sol";

import "hardhat/console.sol";

contract OtusAdapterManager is Ownable {

	// baseAsset => (quoteAsset => otusAdapter contract address); 
	mapping(address => mapping(address => address)) public quoteToBaseAssets;

	constructor() {}

	function initializeVaultAdapter(
		GWAVOracle _gwavOracle,
		address _curveSwap,
		address _optionToken,
		address _optionMarket,
		address _liquidityPool,
		address _shortCollateral,
		address _synthetixAdapter,
		address _optionPricer,
		address _greekCache,
		address _quoteAsset, 
		address _baseAsset,
		address _feeCounter
	) public onlyOwner {

		require(getVaultAdapter(_baseAsset, _quoteAsset) == address(0), "Has vault adapter"); 

		OtusAdapter adapter = new OtusAdapter(
			_gwavOracle,
			_curveSwap,
      _optionToken,
      _optionMarket,
      _liquidityPool,
      _shortCollateral,
      _synthetixAdapter,
      _optionPricer,
      _greekCache,
      _quoteAsset,
      _baseAsset,
      _feeCounter
		); 

		quoteToBaseAssets[_baseAsset][_quoteAsset] = address(adapter); 

	}

	function getVaultAdapter(address _quoteAsset, address _baseAsset) public view returns (address) {
		require(
			quoteToBaseAssets[_baseAsset][_quoteAsset] != address(0), 
			"No Available Otus Adapter for Assets"
		); 
		return quoteToBaseAssets[_quoteAsset][_baseAsset]; 
	}

}