import { log } from '@graphprotocol/graph-ts'
import {
  VaultCreated
} from '../../generated/OtusController/OtusController'
import {
  Global, Manager, Vault
} from '../../generated/schema'
import { OtusVault } from '../../generated/templates';

import { Entity, HOURLY_PERIODS, HOUR_SECONDS, PERIODS, UNIT, UNITDECIMAL, ZERO } from '../lib'

export function handleVaultCreated(event: VaultCreated): void {
  OtusVault.create(event.params.vault);

  let _vaultManager = event.params.user;
  let _vaultAddress = event.params.vault.toHex();
  let _vaultStrategy = event.params.strategy;
  let _vaultInfo = event.params.vaultInfo;
  let _vaultParams = event.params.vaultParams;

  // let _vaultId = event.params.vaultId;

  // let vaultId = Entity.getIDFromAddress(_vaultAddress);
  let vault = new Vault(_vaultAddress);

  let manager = Manager.load(_vaultManager.toHex());
  if (!manager) {
    manager = new Manager(_vaultManager.toHex());
  } 

  vault.manager = manager.id; 
  vault.round = 0; 
  vault.isActive = false; 

  vault.name = _vaultInfo.name; 
  vault.tokenName = _vaultInfo.tokenName; 
  vault.tokenSymbol = _vaultInfo.tokenSymbol; 
  vault.description = _vaultInfo.description; 
  vault.performanceFee = _vaultInfo.performanceFee; 
  vault.managementFee = _vaultInfo.managementFee; 
  vault.asset = _vaultParams.asset; 
  vault.vaultCap = _vaultParams.cap; 

  vault.strategy = _vaultStrategy; 
  vault.totalYieldEarned = ZERO; 

  // query from otusVault contract
  // name
  // description

  // vault.totalYieldEarned = ZERO; 
  // vault.depositsAndWithdrawals = []; 
  manager.save();
  vault.save();
}