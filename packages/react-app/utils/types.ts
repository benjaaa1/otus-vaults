import { ethers, BigNumber } from 'ethers'

export declare type ContractsMap = {
  [name: string]: ethers.Contract
}

export type StrikeTrade = {
  market: string
  optionType: number
  strikeId: BigNumber
  size: BigNumber
  positionId: BigNumber
  strikePrice: BigNumber
}
