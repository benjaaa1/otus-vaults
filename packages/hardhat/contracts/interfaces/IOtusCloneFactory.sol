//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";

interface IOtusCloneFactory {
  function cloneVault() external returns (address otusVaultClone);

  function cloneStrategy(address _strategyImpl) external returns (address strategyClone);

  function _initializeClonedVault(
    address _otusVaultClone,
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _keeper
  ) external;

  /**
   * @notice Clones strategy contract if supervisor has a vault created
   */
  function _initializeClonedStrategy(address _owner, address _vault, address _strategy) external;
}
