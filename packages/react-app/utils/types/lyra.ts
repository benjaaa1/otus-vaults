import { BigNumber } from 'ethers'
import { Quote, Strike } from '@lyrafinance/lyra-js'

export type StrikeTrade = {
  market: string
  optionType: number
  strikeId: BigNumber
  size: BigNumber
  positionId: BigNumber
  strikePrice: BigNumber
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

export type PositionId = {
  [key: string]: CurrentPosition
}


export type LyraStrike = {
  market: string
  selectedOptionType: number | 0
  quote: Quote
} & Strike

export type LyraStrikeMapping = {
  [key: number]: LyraStrike[]
}

export type LyraBoard = {
  id: number
  name: string
  expiryTimestamp: number
  baseIv: BigNumber
  strikes: Strike[]
  strikesByOptionTypes?: LyraStrikeMapping
  marketName: string
}

export type LyraMarket = {
  address: string
  name: string
  isPaused: boolean
  liveBoards: LyraBoard[]
}


