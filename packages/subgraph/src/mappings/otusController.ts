import { log } from '@graphprotocol/graph-ts'
import {
  VaultCreated
} from '../../generated/OtusController/OtusController'
import {
  Global, Vault
} from '../../generated/schema'
import { Entity, HOURLY_PERIODS, HOUR_SECONDS, PERIODS, UNIT, UNITDECIMAL, ZERO } from '../lib'

export function handleVaultCreated(event: VaultCreated): void {

  let _vaultManager = event.params.user;
  let _vaultAddress = event.params.vault;
  let _vaultStrategy = event.params.strategy;
  let _vaultId = event.params.vaultId;

  let vaultId = Entity.getIDFromAddress(_vaultAddress);
  let vault = new Vault(_vaultAddress.toString());

  vault.round = 0; 
  vault.isActive = false; 
  vault.isPublic = false; 
  vault.strategy = _vaultStrategy; 
  vault.totalYieldEarned = ZERO; 
  vault.depositsAndWithdrawals = []; 

  vault.save();
}