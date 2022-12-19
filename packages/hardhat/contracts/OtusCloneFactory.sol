//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "hardhat/console.sol";

// libraries
import {Vault} from "./libraries/Vault.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {StrategyBase} from "./vaultDOV/strategy/StrategyBase.sol";
import {IStrategy} from "./interfaces/IStrategy.sol";
import {IOtusVault} from "./interfaces/IOtusVault.sol";

/**
 * @title OtusCloneFactory
 * @author Otus
 * @dev - Handles cloning the different vault and strategy contracts available to users
 */
contract OtusCloneFactory {
  /// @notice Stores the Otus vault contract implementation address

  address public immutable otusVault;
  /// @notice Stores the Strategy contract implementation address

  address public immutable strategy;
  // address of controller
  address public immutable otusController;

  /************************************************
   *  EVENTS
   ***********************************************/

  event NewVaultClone(address _clone, address _owner);
  event NewStrategyClone(address _clone, address _owner);

  /**
   * @notice Initializes the contract with immutable variables
   * @param _otusVault implementation vault contract address
   * @param _strategyAddress implementation strategy contract address
   * @param _otusController controller contract address
   */
  constructor(address _otusVault, address _strategyAddress, address _otusController) {
    otusVault = _otusVault;
    strategy = _strategyAddress;
    otusController = _otusController;
  }

  /**
   * @notice Clones vault for user
   * @return otusVaultClone proxy vault contract address
   */
  function cloneVault() public returns (address otusVaultClone) {
    require(msg.sender == otusController, "Not allowed to create");
    otusVaultClone = Clones.clone(otusVault);
    emit NewVaultClone(otusVaultClone, msg.sender);
  }

  /**
   * @notice Clones strategy for user
   * @return strategyClone proxy strategy contract address
   */
  function cloneStrategy() public returns (address strategyClone) {
    require(msg.sender == otusController, "Not allowed to create");
    strategyClone = Clones.clone(strategy);
    emit NewStrategyClone(strategyClone, msg.sender);
  }

  /**
   * @notice Initialize cloned vault
   * @param _otusVaultClone cloned vault
   * @param _owner address
   * @param _vaultInfo vault basic info
   * @param _vaultParams vault share info
   * @param _strategy address of clone
   * @param _keeper address
   */
  function _initializeClonedVault(
    address _otusVaultClone,
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _strategy,
    address _keeper
  ) public {
    require(msg.sender == otusController, "Not allowed to create");
    IOtusVault(_otusVaultClone).initialize(_owner, _vaultInfo, _vaultParams, _strategy, _keeper);
  }

  //  * @param marketAddresses lyra option market details addresses

  /**
   * @notice Clones strategy contract
   * @param _owner address
   * @param _vault address
   * @param _strategy address
   * @param _currentStrategy strategy settings
   */
  function _initializeClonedStrategy(
    address _owner,
    address _vault,
    address _strategy,
    StrategyBase.StrategyDetail memory _currentStrategy
  ) public {
    require(msg.sender == otusController, "Not allowed to create");

    require(_vault != address(0), "_vault must be non zero address");

    IStrategy(_strategy).initialize(_owner, _vault, _currentStrategy);
  }
}
