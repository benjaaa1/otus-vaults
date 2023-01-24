import { BigNumber } from 'ethers'
import { Manager } from './manager'
import { UserAction } from './portofolio'

export type VaultTrade = {
  id: string
  market?: string
  txhash: string
  strikeId: string
  positionId: string
  premiumEarned: BigNumber
  strikePrice: BigNumber
  size: BigNumber
  optionType: number
  openedAt: number
  expiry: number
  position: CurrentPosition
}

export type CurrentPosition = {
  id: number
  strikeId: number
  breakEven: number
  size: BigNumber
  settlementPnl: BigNumber
  profitPercentage: number
  isActive: boolean
}

export type Vault = {
  id: string
  createdAt: string | any
  manager: Manager
  round: number
  isActive: boolean
  isPublic: boolean
  strategy: Strategy
  vaultTrades: VaultTrade[]
  userActions: UserAction[]
  name: string
  description: string
  inProgress: boolean
  totalDeposit: BigNumber
  performanceFee: BigNumber
  managementFee: BigNumber
  asset: string
  vaultCap: BigNumber
}

export type Strategy = {
  id: string
  latestUpdate: number
  hedgeType: number
  vaultStrategy: VaultStrategy
  dynamicHedgeStrategy: DynamicHedgeStrategy
  strikeStrategies: StrikeStrategy[]
}

export type StrikeStrategy = {
  id?: string
  targetDelta: BigNumber
  maxDeltaGap: BigNumber
  minVol: BigNumber
  maxVol: BigNumber
  maxVolVariance: BigNumber
  optionType: number | string
}

export type VaultStrategy = {
  id?: string
  allowedMarkets?: string[]
  collatBuffer: BigNumber
  collatPercent: BigNumber
  minTimeToExpiry: number
  maxTimeToExpiry: number
  minTradeInterval: number
  gwavPeriod: number
  hedgeReserve: BigNumber
}

export type DynamicHedgeStrategy = {
  id?: string
  period?: number
  maxLeverageSize: BigNumber
  maxHedgeAttempts: BigNumber
  threshold: BigNumber
}

export type AllAvailableVaults = {
  vaults?: Vault[]
  isLoading: boolean
  isSuccess: boolean
}
