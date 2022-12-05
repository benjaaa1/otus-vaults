import { toBN, ZERO_ADDRESS } from '@lyrafinance/protocol/dist/scripts/util/web3utils';
import { lyraConstants, TestSystem, getMarketDeploys } from '@lyrafinance/protocol';
import { StrategyBase } from '../../../typechain-types/Strategy';
import { Vault } from '../../../typechain-types/OtusVault';
import markets from '../../../constants/synthetix/markets.json';

export const defaultStrategyDetail: StrategyBase.StrategyDetailStruct = {
  hedgeReserve: toBN('.5'),
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('.35'),
  minTimeToExpiry: lyraConstants.DAY_SEC,
  maxTimeToExpiry: lyraConstants.WEEK_SEC * 4,
  minTradeInterval: 600,
  gwavPeriod: 600,
  allowedMarkets: [markets.ETH],
};

export const defaultStrikeStrategyDetailCall: StrategyBase.StrikeStrategyDetailStruct = {
  targetDelta: toBN('0.4'),
  maxDeltaGap: toBN('0.5'), // accept delta from 0.1~0.3
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  maxVolVariance: toBN('0.1'),
  optionType: 3,
};

export const defaultStrikeStrategyDetail: StrategyBase.StrikeStrategyDetailStruct = {
  targetDelta: toBN('0.2').mul(-1),
  maxDeltaGap: toBN('0.1'), // accept delta from 0.1~0.3
  minVol: toBN('0.8'), // min vol to sell. (also used to calculate min premium for call selling vault)
  maxVol: toBN('1.3'), // max vol to sell.
  maxVolVariance: toBN('0.1'),
  optionType: 4,
};

export const defaultDynamicDeltaHedgeDetail: StrategyBase.DynamicDeltaHedgeStrategyStruct = {
  threshold: toBN('1'), // 100%
  maxHedgeAttempts: toBN('5'),
  maxLeverageSize: toBN('2'), // 150% ~ 1.5x 200% 2x
};

export const vaultInfo: Vault.VaultInformationStruct = {
  name: 'New Vault',
  tokenName: 'OtusVault Share',
  tokenSymbol: 'Otus VS',
  description: 'Sell ETH Puts',
  isPublic: true,
  performanceFee: toBN('0'),
  managementFee: toBN('0'),
};
