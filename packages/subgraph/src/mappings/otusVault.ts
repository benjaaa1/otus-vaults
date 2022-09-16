import { log } from '@graphprotocol/graph-ts'
import { StrategyUpdated, Trade, Hedge, PositionReduced, RoundStarted, RoundClosed, RoundSettled, Deposit, InitiateWithdraw, Redeem, Withdraw } from '../../generated/templates/OtusVault/OtusVault'
import {
  Global, Vault, VaultTrade, VaultPosition, UserPortfolio, UserAction, Manager, ManagerAction
} from '../../generated/schema'

export function handleStrategyUpdate(event: StrategyUpdated): void {

}

export function handleVaultTrade(event: Trade): void {

}

export function handleVaultHedge(event: Hedge): void {

}

export function handlePositionReduced(event: PositionReduced): void {

}

export function handleRoundStart(event: RoundStarted): void {

}

export function handleRoundClosed(event: RoundClosed): void {

}

export function handleRoundSettled(event: RoundSettled): void {

}

export function handleDeposit(event: Deposit): void {

}

export function handleInitiateWithdraw(event: InitiateWithdraw): void {

}

export function handleRedeem(event: Redeem): void {

}

export function handleWithdraw(event: Withdraw): void {

}