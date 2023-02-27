//SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import {Vault} from "../libraries/Vault.sol";

interface IOtusVault {
  function initialize(
    address _owner,
    Vault.VaultInformation memory _vaultInfo,
    Vault.VaultParams memory _vaultParams,
    address _keeper
  ) external;

  function setVaultSetting(Vault.VaultInformation memory _vaultInfo) external;

  function startNextRound() external;

  function closeRound() external;
}
