import { Address, BigInt, Bytes, DataSourceContext, store, TypedMap } from '@graphprotocol/graph-ts';
import {
  HedgeClosePosition,
  Hedge,
  StrikeStrategyUpdated,
  StrategyHedgeTypeUpdated,
  HedgeStrategyUpdated,
  StrategyUpdated,
} from '../../generated/templates/Strategy/Strategy';
import {
  Global,
  Vault,
  VaultTrade,
  UserPortfolio,
  UserAction,
  Manager,
  ManagerAction,
  VaultStrategy,
  Strategy,
  DynamicHedgeStrategy,
  StrikeStrategy
} from '../../generated/schema';

export function handleHedgeClosePosition(event: HedgeClosePosition): void { }

export function handleHedge(event: Hedge): void { }

export function handeStrikeStrategyUpdate(event: StrikeStrategyUpdated): void {
  let strategyAddress = event.address as Address;
  let strikeStrategies = event.params.currentStrikeStrategies;

  let strategy = Strategy.load(strategyAddress.toHex());
  if (!strategy) {
    strategy = new Strategy(strategyAddress.toHex());
  }

  for (let i = 0; i < strikeStrategies.length; i++) {
    let strikeStrategy = strikeStrategies[i];

    let newStrikeStrategy = StrikeStrategy.load(strikeStrategy.optionType.toHex() + strategy.id);
    if (newStrikeStrategy == null) {
      newStrikeStrategy = new StrikeStrategy(strikeStrategy.optionType.toHex() + strategy.id);
    }

    newStrikeStrategy.strategy = strategy.id;
    newStrikeStrategy.targetDelta = strikeStrategy.targetDelta;
    newStrikeStrategy.maxDeltaGap = strikeStrategy.maxDeltaGap;
    newStrikeStrategy.minVol = strikeStrategy.minVol;
    newStrikeStrategy.maxVol = strikeStrategy.maxVol;
    newStrikeStrategy.maxVolVariance = strikeStrategy.maxVolVariance;
    newStrikeStrategy.optionType = strikeStrategy.optionType;
    newStrikeStrategy.save();
  }

  strategy.save()

}

export function handleVaultStrategyUpdate(event: StrategyUpdated): void {
  let strategyAddress = event.address as Address;
  let timestamp = event.block.timestamp;
  let vault = event.params.vault;
  let strategyUpdated = event.params.updatedStrategy;

  let vaultStrategy = VaultStrategy.load(strategyAddress.toHex());
  if (!vaultStrategy) {
    vaultStrategy = new VaultStrategy(strategyAddress.toHex());
  }

  let strategy = Strategy.load(strategyAddress.toHex());
  if (!strategy) {
    strategy = new Strategy(strategyAddress.toHex());
  }

  strategy.vault = vault.toHex();
  strategy.latestUpdate = timestamp;
  vaultStrategy.strategy = strategy.id;

  vaultStrategy.hedgeReserve = strategyUpdated.hedgeReserve;
  vaultStrategy.collatBuffer = strategyUpdated.collatBuffer;
  vaultStrategy.collatPercent = strategyUpdated.collatPercent;
  vaultStrategy.minTimeToExpiry = strategyUpdated.minTimeToExpiry;
  vaultStrategy.maxTimeToExpiry = strategyUpdated.maxTimeToExpiry;
  vaultStrategy.minTradeInterval = strategyUpdated.minTradeInterval;
  vaultStrategy.gwavPeriod = strategyUpdated.gwavPeriod;
  vaultStrategy.allowedMarkets = strategyUpdated.allowedMarkets;

  strategy.save();
  vaultStrategy.save();

  let dynamicHedgeStrategy = DynamicHedgeStrategy.load(strategyAddress.toHex());
  if (!dynamicHedgeStrategy) {
    dynamicHedgeStrategy = new DynamicHedgeStrategy(strategyAddress.toHex());
  }

  dynamicHedgeStrategy.strategy = strategy.id;
  dynamicHedgeStrategy.save();

}

export function handleHedgeTypeUpdate(event: StrategyHedgeTypeUpdated): void {
  let strategyAddress = event.address as Address;
  let timestamp = event.block.timestamp;
  let hedgeType = event.params.hedgeType;

  let strategy = Strategy.load(strategyAddress.toHex());
  if (!strategy) {
    strategy = new Strategy(strategyAddress.toHex());
  }

  strategy.latestUpdate = timestamp;
  strategy.hedgeType = hedgeType;

  strategy.save();
}

export function handleHedgeStrategyUpdate(event: HedgeStrategyUpdated): void {
  let strategyAddress = event.address as Address;
  let timestamp = event.block.timestamp;

  let dynamicHedgeStrategy = DynamicHedgeStrategy.load(strategyAddress.toHex());
  if (!dynamicHedgeStrategy) {
    dynamicHedgeStrategy = new DynamicHedgeStrategy(strategyAddress.toHex());
  }

  let strategy = Strategy.load(strategyAddress.toHex());
  if (!strategy) {
    strategy = new Strategy(strategyAddress.toHex());
  }

  strategy.latestUpdate = timestamp;

  dynamicHedgeStrategy.strategy = strategy.id;

  dynamicHedgeStrategy.threshold = event.params.dynamicStrategy.threshold;
  dynamicHedgeStrategy.maxHedgeAttempts = event.params.dynamicStrategy.maxHedgeAttempts;
  dynamicHedgeStrategy.maxLeverageSize = event.params.dynamicStrategy.maxLeverageSize;

  strategy.save();
  dynamicHedgeStrategy.save();
}
