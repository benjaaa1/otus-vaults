import { log } from '@graphprotocol/graph-ts';
import { VaultCreated } from '../../generated/OtusController/OtusController';
import { Global, Manager, Vault, Strategy as OtusStrategy } from '../../generated/schema';
import { OtusVault, Strategy } from '../../generated/templates';

import { Entity, HOURLY_PERIODS, HOUR_SECONDS, PERIODS, UNIT, UNITDECIMAL, ZERO } from '../lib';

export function handleVaultCreated(event: VaultCreated): void {
  OtusVault.create(event.params.vault);
  // Strategy.create(event.params.strategy);

  let _vaultManager = event.params.user;
  let _vaultAddress = event.params.vault.toHex();
  let _vaultStrategy = event.params.strategy;
  let _vaultInfo = event.params.vaultInfo;
  let _vaultParams = event.params.vaultParams;

  let vault = new Vault(_vaultAddress);
  // let strategy = new OtusStrategy(_vaultStrategy.toHex());

  let manager = Manager.load(_vaultManager.toHex());
  if (!manager) {
    manager = new Manager(_vaultManager.toHex());
  }

  // strategy.vault = _vaultAddress;
  vault.strategy = _vaultStrategy.toHex();
  vault.manager = manager.id;
  vault.round = 0;
  vault.isActive = false;

  vault.name = _vaultInfo.name;
  vault.tokenName = _vaultInfo.tokenName;
  vault.tokenSymbol = _vaultInfo.tokenSymbol;
  vault.description = _vaultInfo.description;
  vault.performanceFee = _vaultInfo.performanceFee;
  vault.managementFee = _vaultInfo.managementFee;
  vault.asset = _vaultParams.asset; // need lib with constants to map out
  vault.vaultCap = _vaultParams.cap;

  vault.strategy = _vaultStrategy.toHex();
  vault.totalYieldEarned = ZERO;
  // vault.vaultTrades = [];
  vault.createdAt = event.block.timestamp;

  manager.save();
  vault.save();
  // strategy.save();
}
