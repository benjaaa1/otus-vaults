//SPDX-License-Identifier:ISC
pragma solidity 0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import {IOtusCloneFactory} from "../interfaces/IOtusCloneFactory.sol";
import {IERC20} from "openzeppelin-contracts-4.4.1/token/ERC20/IERC20.sol";

// libraries
import {Vault} from "../libraries/Vault.sol";

/**
 * @title OtusController
 * @author Otus
 * @dev - Stores created vaults and strategies with owners
 */
contract OtusController is Ownable {
  struct StrategyInformation {
    uint strategyType;
    address strategyImpl;
  }

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

  // mapping of vault to manager
  mapping(address => address) public managers;

  // mapping of manager to vaults
  mapping(address => address[]) public vaults;

  // mapping of strategy to its vault
  mapping(address => address) public strategies;

  // mapping of vault to its Strategy
  mapping(address => StrategyInformation[]) public vaultStrategies;

  /************************************************
   *  Otus Vault Strategy Information
   ***********************************************/

  // mapping strategy types 1 => options 2 => futures
  mapping(uint => bool) public types;

  mapping(uint => StrategyInformation) public strategies;

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

  event StrategyCreated(msg.sender, vault, strategy);

  /************************************************
   *  ERRORS
   ***********************************************/
  error NotVaultOwner();

  /************************************************
   *  CONSTRUCTOR & INITIALIZATION
   ***********************************************/

  /**
   * @notice Assign lyra registry and snx market managers
   * @param _keeper keeper address - gelato
   * @param _markets bytes32 of market names (eth btc)
   * @param _lyraBases address of lyrabase (eth btc)
   */
  constructor(address _keeper, bytes32[] memory _markets, address[] memory _lyraBases) Ownable() {
    keeper = _keeper;
    markets = _markets;
    uint len = _markets.length;
    for (uint i = 0; i < len; i++) {
      bytes32 key = _markets[i];
      address lyraBase = _lyraBases[i];
      lyraBases[key] = lyraBase;
    }
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
  function setFuturesMarkets(bytes32 _markets, address[] memory _futuresMarkets) public onlyOwner {
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
   * @param _type
   * @param _valid
   */
  function setValidType(uint _type, bool _valid) public onlyOwner {
    // can turn off certain strategy types for otus vaults
    types[_type] = _valid;
  }

  /**
   * @notice set strategy info
   * @param _type
   * @param _strategyImpl
   */
  function setStrategy(uint _type, address _strategyImpl) public onlyOwner {
    Strategy memory strategyImpl = StrategyInformation(_type, _strategyImpl);
    strategies[_type] = strategyImpl;
  }

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

  /**
   * @notice Create Options Strategy for Vault controlled
   * @param _type type = 0 options 1 futures
   * @param _otusVault vault instant information
   */
  function createOptionsStrategy(uint _type, address _otusVault) public {
    // verify _otusVault is owned by msg.sender and does not have a strategy instant already
    address owner = managers[_otusVault];

    if (owner != msg.sender) {
      revert NotVaultOwner();
    }

    // 0 is options 1 - futures 2 - nft
    address strategy = IOtusCloneFactory(otusCloneFactory).cloneStrategy(
      strategies[_type].strategyImpl
    );

    require(strategy != address(0), "Strategy not created");

    strategies[strategy] = vault;

    vaultStrategies[vault] = StrategyInformation(_type, strategy);

    // initialize strategy
    IOtusCloneFactory(otusCloneFactory)._initializeClonedStrategy(msg.sender, _otusVault, strategy);

    // set strategy on vault
    emit StrategyCreated(msg.sender, vault, strategy);
  }

  /**
   * @notice Set options keeper
   * @param _keeper address
   */
  function setKeeper(address _keeper) external onlyOwner {
    keeper = _keeper;
  }

  /**
   * @notice Get vaults and strategies by owner
   * @return userVaults vault owned
   * @return userStrategies vault's strategies
   */
  function getUserManagerDetails()
    public
    view
    returns (address[] memory userVaults, Strategy[] memory userStrategies)
  {
    address _msgSender = msg.sender;
    userVaults = _getVaults(_msgSender);
    userStrategies = _getStrategies(userVaults);
  }

  function _getVaultOwner(address _vault) public view returns (address _owner) {
    return managers[_vault];
  }

  function _getVaults(address _msgSender) public view returns (address[] memory userVaults) {
    userVaults = vaults[_msgSender];
  }

  function _getStrategies(
    address _managerVault
  ) public view returns (Strategy[] memory userStrategies) {
    return vaultStrategies[_managerVault];
  }

  // get set values (option markets lyra base futures markets used by strategies)
  function _getOptionsContracts()
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
