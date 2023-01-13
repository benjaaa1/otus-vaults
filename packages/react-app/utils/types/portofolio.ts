import { BigNumber } from 'ethers'
import { Vault } from './vault'

export type UserAction = {
  id: string
  txhash: string
  timestamp: string | any
  amount: BigNumber
  isDeposit: boolean
  vault: Vault
}

export type UserPortfolio = {
  id: string
  account: string
  balance: BigNumber
  yieldEarned: BigNumber
  userActions: UserAction[]
}

export type RawUserAction = {
  id: string
  txhash: string
  timestamp: BigNumber
  amount: BigNumber
  isDeposit: boolean
  vault?: any
}

export type RawUserPortfolio = {
  id: string
  account: string
  balance: BigNumberish
  yieldEarned: BigNumberish
  userActions: any[]
}