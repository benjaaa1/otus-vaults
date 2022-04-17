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

	function setVaultAdapter(address _baseAsset, address _quoteAsset, address _vaultAdapter) external onlyOwner {
		require(
			quoteToBaseAssets[_baseAsset][_quoteAsset] == address(0), 
			"Has an available Otus Adapter."
		); 
		quoteToBaseAssets[_baseAsset][_quoteAsset] = _vaultAdapter; 
	}
	
	function getVaultAdapter(address _baseAsset, address _quoteAsset) public view returns (address) {
		require(
			quoteToBaseAssets[_baseAsset][_quoteAsset] != address(0), 
			"No Available Otus Adapter for Assets."
		); 
		return quoteToBaseAssets[_baseAsset][_quoteAsset]; 
	}

	function hasVaultAdapter(address _baseAsset, address _quoteAsset) public view returns (bool hasAdapter) {
		hasAdapter = quoteToBaseAssets[_baseAsset][_quoteAsset] != address(0) ? true : false; 
	}

}