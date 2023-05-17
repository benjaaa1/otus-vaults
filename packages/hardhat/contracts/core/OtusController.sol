//SPDX-License-Identifier:ISC
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {IOtusCloneFactory} from "../interfaces/IOtusCloneFactory.sol";
import {IERC20} from "openzeppelin-contracts-4.4.1/token/ERC20/IERC20.sol";

// libraries
import {Vault} from "../libraries/Vault.sol";

/*
 * Otus Controller
 * =================
 *
 * Otus Vaults allows anyone to create a vault with a specified end date, from 1 day - 4 weeks.
 * Otus Controller is used by managers to create an instance of their
 * own vault and then an intstance of different strategies (options / futures).
 * Otus Controller holds vault/strategy addresses.
 * It also controls access to clone factory clone vault/strategy and instantiation methods.
 *
 */

/**
 * @title OtusController
 * @author Otus
 */
contract OtusController is Ownable {
  // otus strategy information
  struct StrategyInformation {
    bytes32 strategyType;
    address strategyImpl;
    bool active;
  }

  // vault and it's strategies set
  struct VaultStrategy {
    bytes32 strategyType;
    address strategyInstance;
  }

  /************************************************
   *  Otus Vault Strategy Information
   ***********************************************/

  mapping(uint => bool) public types;

  // strategy types added by otus controller
  // keccack256(OPTIONS) => StrategyInfo
  // keccack256(FUTURES) => StrategyInfo
  mapping(bytes32 => StrategyInformation) public strategies;

  uint public minDuration = 24 hours;

  uint public maxDuration = 12 weeks;

  /************************************************
   *  Otus Markets Supported
   ***********************************************/

  // markets supported by otus
  bytes32[] public markets;

  /************************************************
   * STATE - VAULT STRATEGY MANAGERS
   ***********************************************/

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

  // mapping of vault to manager
  mapping(address => address) public managers;

  // mapping of manager to vaults
  mapping(address => address[]) public vaults;

  // mapping of vault to its VaultStrategy
  mapping(address => VaultStrategy[]) public vaultStrategies;

  /************************************************
   *  EVENTS
   ***********************************************/

  event VaultCreated(
    address indexed user,
    address indexed vault,
    Vault.VaultInformation vaultInfo,
    Vault.VaultParams vaultParams
  );

  event OtusCloneFactoryUpdated(address indexed user, address otusCloneFactory);

  event StrategyCreated(address indexed user, address vault, address strategy);

  /************************************************
   *  ERRORS
   ***********************************************/
  error NotVaultOwner();

  error VaultHasStrategyType(address user, address vault);

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  /**
   * @notice Assign lyra registry and snx market managers
   * @param _markets bytes32 of market names (eth btc)
   * @param _lyraBases address of lyrabase (eth btc)
   */
  constructor(bytes32[] memory _markets, address[] memory _lyraBases) Ownable() {
    markets = _markets;
    uint len = _markets.length;
    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address lyraBase = _lyraBases[i];
      lyraBases[key] = lyraBase;
    }
  }

  /************************************************
   *  SET CONTRACT ADDRESSES
   ***********************************************/

  ///@dev add set lyra base

  /************************************************
   *  SETTINGS
   ***********************************************/

  /**
   * @notice set min vault duration - controlled by otus
   * @param _minDuration min vault duration
   */
  function setMinDuration(uint _minDuration) external onlyOwner {
    minDuration = _minDuration;
  }

  /**
   * @notice set max vault duration - controlled by otus
   * @param _maxDuration max vault duration
   */
  function setMaxDuration(uint _maxDuration) external onlyOwner {
    maxDuration = _maxDuration;
  }

  /**
   * @notice set option markets used in Options Strategies
   * @param _markets market name in bytes32 (ETH / BTC)
   * @param _optionMarkets lyra option market address
   */
  function setOptionsMarkets(bytes32 _markets, address[] memory _optionMarkets) public onlyOwner {
    uint len = _markets.length;
    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address optionMarkets = _optionMarkets[i];
      lyraOptionMarkets[key] = optionMarkets;
    }
  }

  /**
   * @notice set futures markets used in Synthetix Futures Strategies
   * @param _markets market name in bytes32 (ETH / BTC)
   * @param _futuresMarkets futures market address
   */
  function setFuturesMarkets(
    bytes32[] memory _markets,
    address[] memory _futuresMarkets
  ) public onlyOwner {
    uint len = _markets.length;
    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address futuresMarkets = _futuresMarkets[i];
      futuresMarketsByKey[key] = futuresMarkets;
    }
  }

  /**
   * @notice set clone factory address
   * @param _otusCloneFactory address
   */
  function setOtusCloneFactory(address _otusCloneFactory) public onlyOwner {
    require(_otusCloneFactory != address(0), "Must be a contract address");
    otusCloneFactory = _otusCloneFactory;
    emit OtusCloneFactoryUpdated(msg.sender, _otusCloneFactory);
  }

  /**
   * @notice set valid clone
   * @param _type 0 - options 1 - futures
   * @param _valid bool to activate
   */
  function setValidType(uint _type, bool _valid) public onlyOwner {
    // can turn off certain strategy types for otus vaults
    types[_type] = _valid;
  }

  /**
   * @notice set strategy info
   * @param _type INIT OPTIONS FUTURES
   * @param _strategyImpl address of impl
   */
  function setStrategy(string memory _type, address _strategyImpl) public onlyOwner {
    bytes32 _etype = keccak256(abi.encodePacked(_type));
    StrategyInformation memory strategyInfo = StrategyInformation({
      strategyType: _etype,
      strategyImpl: _strategyImpl,
      active: true
    });
    strategies[_etype] = strategyInfo;
  }

  /**
   * @notice Set options keeper
   * @param _keeper address
   */
  function setKeeper(address _keeper) external onlyOwner {
    keeper = _keeper;
  }

  /************************************************
   *  CREATE OTUS VAULT
   ***********************************************/
  /**
   * @notice Create Options Vault controlled
   * @param _vaultInfo vault information
   * @param _vaultParams vault shares information
   */
  function createVault(
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams
  ) external {
    // create vault
    address vault = IOtusCloneFactory(otusCloneFactory).cloneVault();

    // add vault created to mapping
    address[] memory _vaults = vaults[msg.sender];
    uint len = _vaults.length;

    require(len < 18, "Max 18 vaults created");
    require(vault != address(0), "Vault not created");
    managers[vault] = msg.sender;
    vaults[msg.sender].push(vault);

    // initialize vault
    IOtusCloneFactory(otusCloneFactory)._initializeClonedVault(
      vault,
      msg.sender,
      _vaultInfo,
      _vaultParams,
      keeper
    );

    emit VaultCreated(msg.sender, vault, _vaultInfo, _vaultParams);
  }

  /************************************************
   *  CREATE STRATEGY FOR VAULT
   ***********************************************/
  /**
   * @notice Create Options Strategy for Vault controlled
   * @param _type type = 0 options 1 futures
   * @param _otusVault vault instant information
   */
  function createStrategy(string memory _type, address _otusVault) public {
    bytes32 _etype = keccak256(abi.encodePacked(_type));

    // verify _otusVault is owned by msg.sender and does not have a strategy type
    // instance already
    address owner = managers[_otusVault];

    if (owner != msg.sender) {
      revert NotVaultOwner();
    }

    VaultStrategy[] storage _vaultStrategies = vaultStrategies[_otusVault];

    for (uint i = 0; i < _vaultStrategies.length; i++) {
      if (
        _vaultStrategies[i].strategyType == _etype &&
        _vaultStrategies[i].strategyInstance != address(0)
      ) {
        revert VaultHasStrategyType(msg.sender, _otusVault);
      }
    }

    // 0 is options 1 - futures 2 - nft
    address strategyInstance = IOtusCloneFactory(otusCloneFactory).cloneStrategy(
      strategies[_etype].strategyImpl
    );

    require(strategyInstance != address(0), "Strategy not created");

    // mapping(address => VaultStrategy[]) public vaultStrategies;
    // VaultStrategy memory _vaultStrategy = ;

    _vaultStrategies.push(
      VaultStrategy({strategyType: _etype, strategyInstance: strategyInstance})
    );

    // initialize strategy
    IOtusCloneFactory(otusCloneFactory)._initializeClonedStrategy(
      msg.sender,
      _otusVault,
      strategyInstance
    );

    // set strategy on vault
    emit StrategyCreated(msg.sender, _otusVault, strategyInstance);
  }

  /************************************************
   *  GETTERS - VAULT / STRATEGY / MANAGER INFO
   ***********************************************/

  function _getVaults(address _msgSender) public view returns (address[] memory userVaults) {
    userVaults = vaults[_msgSender];
  }

  function _getStrategies(address _managerVault) public view returns (VaultStrategy[] memory) {
    return vaultStrategies[_managerVault];
  }

  function _validateVaultStrategy(bytes32 _etype) public view returns (bool) {
    StrategyInformation memory _strategyInfo = strategies[_etype];
    if (address(_strategyInfo.strategyImpl) == address(0)) {
      // strategy type does not exist
      return false;
    }
    return true;
  }

  function _getVaultOwner(address _vault) public view returns (address _owner) {
    return managers[_vault];
  }

  // get set values (option markets lyra base futures markets used by strategies)
  function _getOptionsContracts()
    public
    view
    returns (
      bytes32[] memory _markets,
      address[] memory _lyraBases,
      address[] memory _lyraOptionMarkets
    )
  {
    uint len = markets.length;
    _lyraBases = new address[](len);
    _lyraOptionMarkets = new address[](len);

    for (uint i = 0; i < len; i++) {
      bytes32 market = markets[i];

      _lyraBases[i] = lyraBases[market];
      _lyraOptionMarkets[i] = lyraOptionMarkets[market];
    }
    _markets = markets;
  }

  /************************************************
   * VALIDATE
   ***********************************************/

  /**
   * @notice Low level call guard
   * In futures strategies
   * - close
   * In options strategies
   * - close
   * - reducePosition
   * - userHedge
   * - closeUserHedge
   */
  mapping(bytes32 => bool) public validSignature;

  function setValidExecute(bytes calldata _data, bool _valid) external onlyOwner {
    validSignature[keccak256(abi.encodePacked(_data))] = _valid;
  }

  function _validateFunctionSignature(bytes calldata _data) public view returns (bool, bytes32) {
    bytes32 _methodSignature = keccak256(abi.encodePacked(_data));
    if (validSignature[_methodSignature]) {
      return (true, _methodSignature);
    } else {
      return (false, _methodSignature);
    }
  }
}
