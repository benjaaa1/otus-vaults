import { Address, BigInt, Bytes, DataSourceContext, store } from '@graphprotocol/graph-ts';
import {
  StrategyUpdated,
  Trade,
  PositionReduced,
  RoundStarted,
  RoundClosed,
  RoundSettled,
  Deposit,
  InitiateWithdraw,
  Redeem,
  Withdraw,
  TradeActiveTradesStruct,
} from '../../generated/templates/OtusVault/OtusVault';
import { Global, Vault, VaultTrade, UserPortfolio, UserAction, Manager, ManagerAction } from '../../generated/schema';

enum TradeType {
  LongCall,
  LongPut,
  ShortCallBase,
  ShortCallQuote,
  ShortPutQuote,
}

export function handleStrategyUpdate(event: StrategyUpdated): void {}

export function handleVaultTrade(event: Trade): void {
  let otusVaultAddress = event.address as Address;
  let createdAt = event.block.timestamp;
  let round = event.params.round;
  let txhash = event.transaction.hash;

  let activeTrades = event.params.activeTrades;

  let vault = Vault.load(otusVaultAddress.toHex());
  if (vault == null) {
    vault = new Vault(otusVaultAddress.toHex());
    vault.save();
  }

  // trade should be by strikeid + positionid
  for (let i = 0; i < activeTrades.length; ++i) {
    let activeTrade = activeTrades[i];
    let newTrade = new VaultTrade(vault.id + '-' + activeTrade.positionId.toHex());
    newTrade.vault = vault.id;
    newTrade.strikeId = activeTrade.strikeId;
    newTrade.optionType = activeTrade.optionType;
    newTrade.positionId = activeTrade.positionId;
    newTrade.txhash = txhash;
    newTrade.strikePrice = activeTrade.strikePrice;
    newTrade.expiry = activeTrade.expiry;
    newTrade.openedAt = createdAt;
    newTrade.premiumEarned = activeTrade.premium;
    newTrade.round = round;
    newTrade.size = activeTrade.size;
    newTrade.save();
  }
}

export function handlePositionReduced(event: PositionReduced): void {}

export function handleRoundStart(event: RoundStarted): void {}

export function handleRoundClosed(event: RoundClosed): void {}

export function handleRoundSettled(event: RoundSettled): void {}

// let otusVaultEntity = Vault.load(otusVaultAddress.toHex());
// if(otusVaultEntity == null) {
//   otusVaultEntity = new Vault(otusVaultAddress.toHex());
// }

// userAction.vault = otusVaultAddress.toHex();

export function handleDeposit(event: Deposit): void {
  let otusVaultAddress = event.address as Address;
  let depositor = event.params.account;
  let userAction = new UserAction(otusVaultAddress.toHex() + '-' + depositor.toHex());
  let txhash = event.transaction.hash;
  let timestamp = event.block.timestamp;

  let userPortfolioEntity = UserPortfolio.load(depositor.toHex());
  if (!userPortfolioEntity) {
    userPortfolioEntity = new UserPortfolio(depositor.toHex());
    userPortfolioEntity.balance = event.params.amount;
  }

  userAction.timestamp = timestamp;
  userAction.txhash = txhash;
  userAction.isDeposit = true;
  userAction.amount = event.params.amount;
  userAction.vault = otusVaultAddress.toHex();
  userAction.userPortfolio = userPortfolioEntity.id;

  userAction.save();
  userPortfolioEntity.save();
}

export function handleInitiateWithdraw(event: InitiateWithdraw): void {}

export function handleRedeem(event: Redeem): void {}

export function handleWithdraw(event: Withdraw): void {}
