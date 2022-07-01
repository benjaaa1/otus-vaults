//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {StrategyBase} from "./vault/strategy/StrategyBase.sol";

import {IOtusCloneFactory} from "./interfaces/IOtusCloneFactory.sol"; 
import {IFuturesMarketManager} from "./interfaces/IFuturesMarketManager.sol"; 
import {LyraRegistry} from "@lyrafinance/protocol/contracts/periphery/LyraRegistry.sol";
import {OptionGreekCache} from "@lyrafinance/protocol/contracts/OptionGreekCache.sol";
import {LiquidityPool} from "@lyrafinance/protocol/contracts/LiquidityPool.sol";
import {LiquidityToken} from "@lyrafinance/protocol/contracts/LiquidityToken.sol";
import {PoolHedger} from "@lyrafinance/protocol/contracts/libraries/PoolHedger.sol";
import {OptionMarketPricer} from "@lyrafinance/protocol/contracts/OptionMarketPricer.sol";
import {OptionToken} from "@lyrafinance/protocol/contracts/OptionToken.sol";
import {ShortCollateral} from "@lyrafinance/protocol/contracts/ShortCollateral.sol";
import {OptionMarket} from "@lyrafinance/protocol/contracts/OptionMarket.sol";
import {GWAVOracle} from "@lyrafinance/protocol/contracts/periphery/GWAVOracle.sol";
import {IERC20} from "openzeppelin-contracts-4.4.1/token/ERC20/IERC20.sol";
  
// libraries
import {Vault} from "./libraries/Vault.sol";

contract OtusController is Ownable {
  
  IFuturesMarketManager immutable public futuresMarketManager;
  LyraRegistry public lyraRegistry; 

  address public keeper;  
  address public otusCloneFactory;  

  mapping(address => address[]) public marketAddress; 
  mapping(address => address) public futuresMarketByAsset; 

	mapping(address => address[]) public vaults; 

	mapping(address => address) public strategies;

	mapping(address => address) public vaultBridge; 
  
  mapping(address => bool) public vaultsStatus;
  address[] public vaultsList; 

  constructor(address _lyraRegistry, address _futuresMarketManager) Ownable() {
    lyraRegistry = LyraRegistry(_lyraRegistry);
    futuresMarketManager = IFuturesMarketManager(_futuresMarketManager);
  }

  function setOtusCloneFactory(address _otusCloneFactory) public onlyOwner {
    require(_otusCloneFactory != address(0), "Must be a contract address");
    otusCloneFactory = _otusCloneFactory; 
  }

  // /**
	// * @notice Create Delta Neutral Vault controlled
	// */
  // function createDeltraNeutralVault(
  //   address market,
  //   Vault.VaultInformation memory _vaultInfo,
  //   Vault.VaultParams memory _vaultParams,
  //   address keeper
  // ) {
  //   // create vault
  //   address vault = IOtusCloneFactory(otusCloneFactory).cloneVault();
  // }

  /**
	* @notice Create Options Vault controlled
	*/
  function createOptionsVault(		
      address _optionMarket,
      Vault.VaultInformation memory _vaultInfo,
      Vault.VaultParams memory _vaultParams,
      StrategyBase.StrategyDetail memory currentStrategy
    ) external {

    // create vault
    address vault = IOtusCloneFactory(otusCloneFactory).cloneVault();
    // add vault created to mapping
 		address[] memory _vaults = vaults[msg.sender]; 
    uint len = _vaults.length; 

    require(len <= 3, "Max 3 vaults created"); 
    vaults[msg.sender].push(vault);
		require(vault != address(0), "Vault not created"); 

    // create strategy 
    address strategy = IOtusCloneFactory(otusCloneFactory).cloneStrategy(); 
		strategies[vault] = strategy;
		require(strategy != address(0), "Strategy not created"); 

    // initialize vault
    IOtusCloneFactory(otusCloneFactory)._initializeClonedVault(
      vault,
      msg.sender,
      _vaultInfo,
      _vaultParams,
      strategy
    ); 

 		address[] memory marketAddresses = getOptionMarketDetails(_optionMarket); 

    //initialize strategy 
    IOtusCloneFactory(otusCloneFactory)._initializeClonedStrategy(
      msg.sender,
      vault, 
      strategy,
      marketAddresses,
      currentStrategy
    ); 

		_addVault(vault);

  }

  /**
	* @notice Set options keeper
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

    (
      LiquidityPool liquidityPool,
      LiquidityToken liquidityToken,
      OptionGreekCache greekCache,
      OptionMarket optionMarket,
      OptionMarketPricer optionMarketPricer,
      OptionToken optionToken,
      PoolHedger poolHedger,
      ShortCollateral shortCollateral,
      GWAVOracle gwavOracle,
      IERC20 quoteAsset,
      IERC20 baseAsset
    ) = lyraRegistry.marketAddresses(OptionMarket(_optionMarket)); 
    
    address[] memory marketAddresses = new address[](10); 
    marketAddresses[0] = address(quoteAsset);
    marketAddresses[1] = address(baseAsset);
    marketAddresses[2] = address(optionToken);
    marketAddresses[3] = _optionMarket;
    marketAddresses[4] = address(liquidityPool);
    marketAddresses[5] = address(shortCollateral);
    marketAddresses[6] = address(optionMarketPricer);
    marketAddresses[7] = address(greekCache);
    marketAddresses[8] = futuresMarketByAsset[address(baseAsset)];
    marketAddresses[9] = address(gwavOracle); 
    marketAddress[_optionMarket] = marketAddresses;
  }

  function getOptionMarketDetails(address _optionMarket) public view returns (address[] memory mad) {
    mad = marketAddress[_optionMarket];
  }

  function getUserManagerDetails() public view returns (address[] memory userVaults, address[] memory userStrategies) {
    address userSupervisor = msg.sender;
    userVaults = _getVaults(userSupervisor);
    userStrategies = _getStrategies(userVaults); 
  }

	function _getVaults(address userSupervisor) public view returns (address[] memory userVaults) {
		userVaults = vaults[userSupervisor]; 
	}


	function _getStrategies(address[] memory userVaults) public view returns (address[] memory userStrategies) {
    uint len = userVaults.length; 
    userStrategies = new address[](len); 

    for(uint i = 0; i < len; i++) {
      userStrategies[i] = strategies[userVaults[i]];
    }
	}

  function _addVault(address _otusVault) public {
    vaultsList.push(_otusVault); 
    vaultsStatus[_otusVault] = true; 
  }

  function getActiveVaults() public view returns (address[] memory) {
    return vaultsList;
  }
}