import { Address, BigInt, Bytes, DataSourceContext, store } from '@graphprotocol/graph-ts';import { StrategyUpdated, Trade, PositionReduced, RoundStarted, RoundClosed, RoundSettled, Deposit, InitiateWithdraw, Redeem, Withdraw } from '../../generated/templates/OtusVault/OtusVault'
import {
  Global, Vault, VaultTrade, UserPortfolio, UserAction, Manager, ManagerAction
} from '../../generated/schema'

export function handleStrategyUpdate(event: StrategyUpdated): void {

}

export function handleVaultTrade(event: Trade): void {

}

export function handlePositionReduced(event: PositionReduced): void {

}

export function handleRoundStart(event: RoundStarted): void {

}

export function handleRoundClosed(event: RoundClosed): void {

}

export function handleRoundSettled(event: RoundSettled): void {

}


  // let otusVaultEntity = Vault.load(otusVaultAddress.toHex());
  // if(otusVaultEntity == null) {
  //   otusVaultEntity = new Vault(otusVaultAddress.toHex());
  // }

  // userAction.vault = otusVaultAddress.toHex();

export function handleDeposit(event: Deposit): void {
  let otusVaultAddress = event.address as Address;
  let depositor = event.params.account;
  let userAction = new UserAction(otusVaultAddress.toHex() + '-' + depositor.toHex());

  let userPortfolioEntity = UserPortfolio.load(depositor.toHex());
  if (!userPortfolioEntity) {
    userPortfolioEntity = new UserPortfolio(depositor.toHex());
    userPortfolioEntity.balance = event.params.amount; 
  } 
  
  userAction.isDeposit = true; 
  userAction.amount = event.params.amount; 
  userAction.vault = otusVaultAddress.toHex();
  userAction.userPortfolio = userPortfolioEntity.id;

  userAction.save();
  userPortfolioEntity.save();
}

export function handleInitiateWithdraw(event: InitiateWithdraw): void {

}

export function handleRedeem(event: Redeem): void {

}

export function handleWithdraw(event: Withdraw): void {

}