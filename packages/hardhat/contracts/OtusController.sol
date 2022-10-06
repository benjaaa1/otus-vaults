//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

// Hardhat
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {StrategyBase} from "./vaultDOV/strategy/StrategyBase.sol";

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

/**
 * @title OtusController
 * @author Otus
 * @dev - Stores created vaults and strategies with owners
 */
contract OtusController is Ownable {
  IFuturesMarketManager public immutable futuresMarketManager;
  LyraRegistry public lyraRegistry;
  address public keeper;

  address public otusCloneFactory;

  mapping(bytes32 => address) optionMarkets;
  mapping(bytes32 => address) lyraAdapters;
  bytes32[] public lyraAdapterKeys;
  address[] public lyraAdapterValues;
  address[] public lyraOptionMarkets;

  mapping(address => address[]) public marketAddress;
  mapping(address => address) public futuresMarketByAsset;
  address[] public futuresMarkets;

  mapping(address => address[]) public vaults;

  mapping(address => address) public strategies;

  mapping(address => address) public vaultBridge;

  mapping(address => bool) public vaultsStatus;
  address[] public vaultsList;

  uint internal nextVaultId = 1;

  /************************************************
   *  EVENTS
   ***********************************************/

  event VaultCreated(
    uint indexed vaultId,
    address indexed user,
    address indexed vault,
    address strategy,
    Vault.VaultInformation vaultInfo,
    Vault.VaultParams vaultParams
  );

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  /**
   * @notice Assign lyra registry and snx market managers
   * @param _lyraRegistry Lyra registry address
   * @param _futuresMarketManager Synthetix futures market manager address
   * @param _keeper keeper address
   */
  constructor(
    address _lyraRegistry,
    address _futuresMarketManager,
    address _keeper
  ) Ownable() {
    lyraRegistry = LyraRegistry(_lyraRegistry);
    futuresMarketManager = IFuturesMarketManager(_futuresMarketManager);
    keeper = _keeper;
  }

  /**
   * @notice set clone factory address
   * @param _otusCloneFactory address
   */
  function setOtusCloneFactory(address _otusCloneFactory) public onlyOwner {
    require(_otusCloneFactory != address(0), "Must be a contract address");
    otusCloneFactory = _otusCloneFactory;
  }

  /**
   * @notice Create Options Vault controlled
   * @param _vaultInfo vault information
   * @param _vaultParams vault shares information
   * @param currentStrategy vault strategy settings
   */
  function createOptionsVault(
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    StrategyBase.StrategyDetail memory currentStrategy
  ) external {
    // create vault
    address vault = IOtusCloneFactory(otusCloneFactory).cloneVault();
    // add vault created to mapping
    address[] memory _vaults = vaults[msg.sender];
    uint len = _vaults.length;

    require(len < 18, "Max 18 vaults created");
    vaults[msg.sender].push(vault);
    require(vault != address(0), "Vault not created");

    // create strategy clone
    address strategy = IOtusCloneFactory(otusCloneFactory).cloneStrategy();
    require(strategy != address(0), "Strategy not created");
    strategies[vault] = strategy;

    // initialize vault
    IOtusCloneFactory(otusCloneFactory)._initializeClonedVault(
      vault,
      msg.sender,
      _vaultInfo,
      _vaultParams,
      strategy,
      keeper
    );

    // initialize strategy
    console.log(strategy);
    console.log(vault);
    IOtusCloneFactory(otusCloneFactory)._initializeClonedStrategy(
      lyraAdapterKeys,
      lyraAdapterValues,
      lyraOptionMarkets,
      futuresMarkets,
      msg.sender,
      vault,
      strategy,
      currentStrategy
    );

    uint vaultId = nextVaultId++;

    _addVault(vault);

    emit VaultCreated(vaultId, msg.sender, vault, strategy, _vaultInfo, _vaultParams);
  }

  /**
   * @notice Set options keeper
   * @param _keeper address
   */
  function setKeeper(address _keeper) external onlyOwner {
    keeper = _keeper;
  }

  /**
   * @notice Set futures markets
   * @param _baseAsset address of base
   * @param _synth asset name in bytes32
   */
  function setFuturesMarkets(address _baseAsset, bytes32 _synth) external {
    address futuresMarket = futuresMarketManager.marketForKey(_synth);
    futuresMarketByAsset[_baseAsset] = futuresMarket;
    futuresMarkets.push(futuresMarket);
  }

  /**
   * @notice Get futures market by synth name
   * @param _synth asset name in bytes32
   * @return futuresMarket
   */
  function getFuturesMarket(bytes32 _synth) public view returns (address futuresMarket) {
    futuresMarket = futuresMarketManager.marketForKey(_synth);
  }

  /**
   * @notice Get futures market by base address
   * @param _baseAsset address of base
   * @return futuresMarket
   */
  function getFuturesMarketByBaseAsset(address _baseAsset) public view returns (address futuresMarket) {
    futuresMarket = futuresMarketByAsset[_baseAsset];
  }

  /**
   * @notice Set lyra adapter addresses by market bytes32
   * @param _lyraAdapter address of lyradapter for market
   * @param _market bytes32 of market "sETH" / "sBTC"
   * @dev call this after deploy lyra adapter contracts // refactor this method
   */
  function setLyraAdapter(
    address _lyraAdapter,
    address _optionMarket,
    bytes32 _market
  ) public onlyOwner {
    lyraAdapters[_market] = _lyraAdapter;

    optionMarkets[_market] = _optionMarket;

    lyraOptionMarkets.push(_optionMarket);

    lyraAdapterValues.push(_lyraAdapter);

    lyraAdapterKeys.push(_market);
  }

  /**
   * @notice Get vaults and strategies by owner
   * @return userVaults vault owned
   * @return userStrategies vault's strategies
   */
  function getUserManagerDetails() public view returns (address[] memory userVaults, address[] memory userStrategies) {
    address _msgSender = msg.sender;
    userVaults = _getVaults(_msgSender);
    userStrategies = _getStrategies(userVaults);
  }

  function _getVaults(address _msgSender) public view returns (address[] memory userVaults) {
    userVaults = vaults[_msgSender];
  }

  function _getStrategies(address[] memory userVaults) public view returns (address[] memory userStrategies) {
    uint len = userVaults.length;
    userStrategies = new address[](len);

    for (uint i = 0; i < len; i++) {
      userStrategies[i] = strategies[userVaults[i]];
    }
  }

  function _addVault(address _otusVault) public {
    vaultsList.push(_otusVault);
    vaultsStatus[_otusVault] = true;
  }

  function _setVaultStatus(address _otusVault, bool status) public {
    vaultsStatus[_otusVault] = status;
  }

  function getActiveVaults() public view returns (address[] memory) {
    uint len = vaultsList.length;
    address[] memory activeVaults = new address[](len);

    for (uint i = 0; i < len; i++) {
      address _vault = vaultsList[i];
      bool active = vaultsStatus[_vault];
      if (active) {
        activeVaults[i] = _vault;
      }
    }

    return activeVaults;
  }
}
