//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {IFuturesMarketManager} from "./interfaces/IFuturesMarketManager.sol"; 

abstract contract LyraMarketsRegisry {
  struct MarketAddresses {
    address liquidityPool;
    address liquidityCertificate;
    address optionGreekCache;
    address optionMarketPricer;
    address poolHedger;
    address shortCollateral;
    address quoteAsset;
    address baseAsset;
    address optionToken;
  }

  mapping(address => MarketAddresses) public optionMarketsAddresses;

  function getOptionMarkets() external virtual view returns (address[] memory); 
}

contract OtusRegistry is Ownable {

  struct OptionMarketAddresses {
    address futuresMarket;
    address liquidityPool;
    address optionMarket; 
    address shortCollateral;
    address quoteAsset;
    address baseAsset;
    address optionToken;
  }

  mapping(address => bool) public vaultsStatus;
  LyraMarketsRegisry immutable public lyraMarketRegistry;
  IFuturesMarketManager immutable public futuresMarketManager;

  // base token => optionmarketdetails
  mapping(address => OptionMarketAddresses) public baseToOptionMarketAddresses; 

  mapping(address => address) public futuresMarketByAsset; 

  address public keeper;  

	// msg.sender => supervisor
	mapping(address => address) public supervisors;
	address[] public supervisorsList;
	// supervisor =>  vault
	mapping(address => address) public vaults; 
  address[] public vaultsList; 
	// vault =>  strategy
	mapping(address => address) public strategies;

  constructor(address _lyraMarketRegistry, address _futuresMarketManager) Ownable() {
    lyraMarketRegistry = LyraMarketsRegisry(_lyraMarketRegistry);
    futuresMarketManager = IFuturesMarketManager(_futuresMarketManager);
  }

  /**
	* @notice Set keeper
	*/
	function setKeeper(address _keeper) external onlyOwner {
		keeper = _keeper; 
	} 

  function setFuturesMarkets(address _baseAsset, bytes32 _synth) external {
    futuresMarketByAsset[_baseAsset] = futuresMarketManager.marketForKey(_synth); 
  }

  function getFuturesMarket(bytes32 _synth) public view returns (address futuresMarket) {
    futuresMarket = futuresMarketManager.marketForKey(_synth);
  }

  function setOptionMarketDetails(address optionMarket) public {
    // address[] memory optionMarkets = lyraMarketRegistry.getOptionMarkets(); 
    address liquidityPool;
    address shortCollateral;
    address quoteAsset;
    address baseAsset;
    address optionToken;

    (liquidityPool,,,,, shortCollateral, quoteAsset, baseAsset, optionToken) = lyraMarketRegistry.optionMarketsAddresses(optionMarket); 

    OptionMarketAddresses storage newBaseOptionMarketAddresses = baseToOptionMarketAddresses[baseAsset];
    newBaseOptionMarketAddresses.futuresMarket = futuresMarketByAsset[baseAsset];
    newBaseOptionMarketAddresses.liquidityPool = liquidityPool;
    newBaseOptionMarketAddresses.optionMarket = optionMarket;
    newBaseOptionMarketAddresses.shortCollateral = shortCollateral;
    newBaseOptionMarketAddresses.quoteAsset = quoteAsset;
    newBaseOptionMarketAddresses.baseAsset = baseAsset;
    newBaseOptionMarketAddresses.optionToken = optionToken; 

  }

  function getOptionMarketDetails(address baseToken) public view returns (OptionMarketAddresses memory) {
    return baseToOptionMarketAddresses[baseToken]; 
  }

  function getUserManagerDetails() public view returns (address userSupervisor, address userVault, address userStrategy) {
    userSupervisor = _getSupervisor();
    userVault = _getVault(userSupervisor);
    userStrategy = _getStrategy(userVault); 
  }

  function _getSupervisor() public view returns (address userSupervisor) {
		console.log("sender supervisors", msg.sender, supervisors[msg.sender]); 
		userSupervisor = supervisors[msg.sender];
	}


	function _getVault(address userSupervisor) public view returns (address userVault) {
    console.log("sender vaults", msg.sender, vaults[msg.sender]); 
		userVault = vaults[userSupervisor]; 
	}


	function _getStrategy(address userVault) public view returns (address userStrategy) {
    console.log("sender strategy", msg.sender, strategies[msg.sender]); 
		userStrategy = strategies[userVault]; 
	}

  function _addVault(address _otusVault) public {
    vaultsList.push(_otusVault); 
    vaultsStatus[_otusVault] = true; 
  }

  function getActiveVaults() public view returns (address[] memory) {
    return vaultsList;
  }
}