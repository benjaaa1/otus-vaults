//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

// libraries
import {Vault} from "../libraries/Vault.sol";

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategy} from "../interfaces/IStrategy.sol";
import {IOtusVault} from "../interfaces/IOtusVault.sol";

/**
 * @title OtusCloneFactory
 * @author Otus
 * @dev - Handles cloning the different vault and strategy contracts available to users
 */
contract OtusCloneFactory is Ownable {
  /// @notice Stores the Otus vault contract implementation address
  address public immutable otusVault;

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
   * @param _otusController controller contract address
   */
  constructor(address _otusVault, address _otusController) Ownable() {
    otusVault = _otusVault;
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
  function cloneStrategy(address _strategyImpl) public returns (address strategyClone) {
    require(msg.sender == otusController, "Not allowed to create");
    strategyClone = Clones.clone(_strategyImpl);
    emit NewStrategyClone(strategyClone, msg.sender);
  }

  /**
   * @notice Initialize cloned vault
   * @param _otusVaultClone cloned vault
   * @param _owner address
   * @param _vaultInfo vault basic info
   * @param _vaultParams vault share info
   * @param _keeper address
   */
  function _initializeClonedVault(
    address _otusVaultClone,
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _keeper
  ) public {
    require(msg.sender == otusController, "Not allowed to create");
    IOtusVault(_otusVaultClone).initialize(_owner, _vaultInfo, _vaultParams, _keeper);
  }

  /**
   * @notice Clones strategy contract
   * @param _owner address
   * @param _vault address
   * @param _strategy address
   */
  function _initializeClonedStrategy(address _owner, address _vault, address _strategy) public {
    require(msg.sender == otusController, "Not allowed to create");
    require(_vault != address(0), "_vault must be non zero address");
    IStrategy(_strategy).initialize(_owner, _vault);
  }
}
