//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

import 'hardhat/console.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

import {StrategyBase} from './dov/strategy/StrategyBase.sol';

import {IOtusCloneFactory} from './interfaces/IOtusCloneFactory.sol';
import {IERC20} from 'openzeppelin-contracts-4.4.1/token/ERC20/IERC20.sol';

// libraries
import {Vault} from './libraries/Vault.sol';

/**
 * @title OtusController
 * @author Otus
 * @dev - Stores created vaults and strategies with owners
 */
contract OtusController is Ownable {
  ///////////////
  // Variables //
  ///////////////

  // markets supported by otus
  bytes32[] public markets;

  // otus deploys a lyrabase contract for each market (bytes32 is name of market)
  mapping(bytes32 => address) public lyraBases;

  // key is market name maps to futures markets synthetix contracts
  mapping(bytes32 => address) public futuresMarketsByKey;

  // set at deploy to include all available lyra option markets in chain
  mapping(bytes32 => address) public lyraOptionMarkets;

  // address of keeper
  address public keeper;

  // factory
  address public otusCloneFactory;

  // mapping of manager to vaults
  mapping(address => address[]) public vaults;

  // mapping of vault to its strategy
  mapping(address => address) public strategies;

  /************************************************
   *  EVENTS
   ***********************************************/

  event VaultCreated(
    address indexed user,
    address indexed vault,
    address strategy,
    Vault.VaultInformation vaultInfo,
    Vault.VaultParams vaultParams
  );

  event OtusCloneFactoryUpdated(address indexed user, address otusCloneFactory);

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  /**
   * @notice Assign lyra registry and snx market managers
   * @param _keeper keeper address
   * @param _markets bytes32 of market names (eth btc)
   * @param _lyraBases address of lyrabase (eth btc)
   * @param _optionMarkets addresses of lyra option market contracts
   * @param _futuresMarkets futures markets synthetix / gmx
   */
  constructor(
    address _keeper,
    bytes32[] memory _markets,
    address[] memory _lyraBases,
    address[] memory _optionMarkets,
    address[] memory _futuresMarkets
  ) Ownable() {
    keeper = _keeper;
    markets = _markets;
    uint len = _markets.length;
    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];

      address lyraBase = _lyraBases[i];
      address optionMarkets = _optionMarkets[i];
      address futuresMarket = _futuresMarkets[i];

      lyraBases[key] = lyraBase;
      futuresMarketsByKey[key] = futuresMarket;
      lyraOptionMarkets[key] = optionMarkets;
    }
  }

  /**
   * @notice set clone factory address
   * @param _otusCloneFactory address
   */
  function setOtusCloneFactory(address _otusCloneFactory) public onlyOwner {
    require(_otusCloneFactory != address(0), 'Must be a contract address');
    otusCloneFactory = _otusCloneFactory;
    emit OtusCloneFactoryUpdated(msg.sender, _otusCloneFactory);
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

    require(len < 18, 'Max 18 vaults created');
    vaults[msg.sender].push(vault);
    require(vault != address(0), 'Vault not created');

    // create strategy clone
    address strategy = IOtusCloneFactory(otusCloneFactory).cloneStrategy();
    require(strategy != address(0), 'Strategy not created');
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
    IOtusCloneFactory(otusCloneFactory)._initializeClonedStrategy(
      msg.sender,
      vault,
      strategy,
      currentStrategy
    );

    emit VaultCreated(msg.sender, vault, strategy, _vaultInfo, _vaultParams);
  }

  /**
   * @notice Set options keeper
   * @param _keeper address
   */
  function setKeeper(address _keeper) external onlyOwner {
    keeper = _keeper;
  }

  // Set Markets

  // Set Option Markets Contract Addresses

  // Set Futures Markets Contract Addresses

  /**
   * @notice Get vaults and strategies by owner
   * @return userVaults vault owned
   * @return userStrategies vault's strategies
   */
  function getUserManagerDetails()
    public
    view
    returns (address[] memory userVaults, address[] memory userStrategies)
  {
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

  // get set values (option markets lyra base futures markets used by strategies)
  function _getMarketContracts()
    public
    view
    returns (
      bytes32[] memory _markets,
      address[] memory _lyraBases,
      address[] memory _futuresMarkets,
      address[] memory _lyraOptionMarkets
    )
  {
    uint len = markets.length;
    _lyraBases = new address[](len);
    _futuresMarkets = new address[](len);
    _lyraOptionMarkets = new address[](len);

    for (uint i = 0; i < len; i++) {
      bytes32 market = markets[i];

      _lyraBases[i] = lyraBases[market];
      _futuresMarkets[i] = futuresMarketsByKey[market];
      _lyraOptionMarkets[i] = lyraOptionMarkets[market];
    }
    _markets = markets;
  }
}
