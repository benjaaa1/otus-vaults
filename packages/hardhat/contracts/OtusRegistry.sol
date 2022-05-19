//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {IFuturesMarketManager} from "./interfaces/IFuturesMarketManager.sol"; 
import {LyraRegistry} from "@lyrafinance/protocol/contracts/periphery/LyraRegistry.sol";
import {LiquidityPool} from "@lyrafinance/protocol/contracts/LiquidityPool.sol";
import {OptionGreekCache} from "@lyrafinance/protocol/contracts/OptionGreekCache.sol";
import {OptionMarketPricer} from "@lyrafinance/protocol/contracts/OptionMarketPricer.sol";
import {OptionToken} from "@lyrafinance/protocol/contracts/OptionToken.sol";
import {ShortCollateral} from "@lyrafinance/protocol/contracts/ShortCollateral.sol";
import {OptionMarket} from "@lyrafinance/protocol/contracts/OptionMarket.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OtusRegistry is Ownable {
  
  struct OptionMarketAddresses {
    address futuresMarket;
    address optionMarket; 
    address liquidityPool;
    address greekCache;
    address optionMarketPricer;
    address optionToken;
    address shortCollateral;
    address quoteAsset;
    address baseAsset; 
  }

  IFuturesMarketManager immutable public futuresMarketManager;
  LyraRegistry public lyraRegistry; 
  mapping(address => address[]) public marketAddress; 

  mapping(address => address) public futuresMarketByAsset; 

  address public keeper;  

	// msg.sender => supervisor
	mapping(address => address) public supervisors;
	address[] public supervisorsList;
	// supervisor =>  vault
	mapping(address => address) public vaults; 
	// vault =>  strategy
	mapping(address => address) public strategies;
	// vault => l2bridge
	mapping(address => address) public vaultBridge; 
  
  mapping(address => bool) public vaultsStatus;
  address[] public vaultsList; 

  constructor(address _lyraRegistry, address _futuresMarketManager) Ownable() {
    lyraRegistry = LyraRegistry(_lyraRegistry);
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

  function setOptionMarketDetails(address _optionMarket) public {
    LiquidityPool liquidityPool;
    OptionGreekCache greekCache;
    OptionMarketPricer optionMarketPricer;
    OptionToken optionToken;
    ShortCollateral shortCollateral;
    IERC20 quoteAsset;
    IERC20 baseAsset; 

    (liquidityPool,,greekCache,,optionMarketPricer,optionToken,,shortCollateral,quoteAsset,baseAsset) = lyraRegistry.marketAddresses(OptionMarket(_optionMarket)); 

    address[] memory marketAddresses = new address[](9); 
    marketAddresses[0] = address(quoteAsset);
    marketAddresses[1] = address(baseAsset);
    marketAddresses[2] = address(optionToken);
    marketAddresses[3] = _optionMarket;
    marketAddresses[4] = address(liquidityPool);
    marketAddresses[5] = address(shortCollateral);
    marketAddresses[6] = address(optionMarketPricer);
    marketAddresses[7] = address(greekCache);
    marketAddresses[8] = futuresMarketByAsset[address(baseAsset)];

    marketAddress[_optionMarket] = marketAddresses;
  }

  function getOptionMarketDetails(address _optionMarket) public view returns (address[] memory mad) {
    mad = marketAddress[_optionMarket];
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