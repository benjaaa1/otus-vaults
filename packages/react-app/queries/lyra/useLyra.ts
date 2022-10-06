import { useQuery } from 'react-query'

import Lyra, { Board, Market, Quote, Strike } from '@lyrafinance/lyra-js'
import { BigNumber, ethers } from 'ethers'
import QUERY_KEYS from '../../constants/queryKeys'
import { MONTHS } from '../../constants/dates'
import { ONE_BN } from '../../constants/bn'
import { INFURA_ID } from '../../constants/api'
import { MarketType } from '../../constants/markets'

const isProduction = process.env.NODE_ENV === 'production'
console.log({ isProduction, env: process.env })
let provider = new ethers.providers.InfuraProvider(10, INFURA_ID)
// let provider = new ethers.providers.JsonRpcProvider(
//   'http://localhost:8545',
//   31337
// )
// export const lyra = isProduction
//   ? new Lyra({
//       provider,
//     })
//   : new Lyra(69)
console.log({ provider })
export const lyra = new Lyra({
  provider,
})

export const getLyraMarkets = async () => await lyra.markets()

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

export const useLyraMarket = () => {
  return useQuery<LyraMarket[] | null>(
    QUERY_KEYS.Lyra.Markets(),
    async () => {
      const response: Market[] = await lyra.markets()
      console.log({ response })
      return response ? parseMarketResponse(response) : null
    },
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )
}

export const useStrikes = (market: string, strikeId: number) => {
  return useQuery<Strike>(
    QUERY_KEYS.Lyra.Strike(market, strikeId),
    async () => {
      const response = await lyra.strike(market, strikeId)
      console.log({ response })
      return response
    },
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )
}

const OPTION_TYPES = {
  0: [true, true], // buy call
  1: [false, true], // buy put
  2: [true, false], // sell covered call
  3: [true, false], // sell call
  4: [false, false], // sell put
}

export const getStrikeQuote = async (
  trade: LyraStrike,
  optionType: number,
  size: BigNumber
) => {
  const [isCall, isBuy] = OPTION_TYPES[optionType]
  const marketName = trade.market
  const _strike = await lyra.strike(marketName, trade.id)
  const quote = await _strike.quote(isCall, isBuy, size)
  console.log({ quote })
  return {
    ..._strike,
    quote,
    selectedOptionType: optionType,
    market: marketName,
  }
  // return useQuery<any>(
  //   QUERY_KEYS.Lyra.Quote(strike.id),
  //   async () => {

  //     return response
  //       ? { ...response, quote: response, selectedOptionType: optionType }
  //       : null
  //   },
  //   {
  //     refetchInterval: false,
  //     refetchOnWindowFocus: false,
  //     refetchOnMount: false,
  //   }
  // )
}
/**
 * @dev add types to liveBoardsWithQuotedStrikes
 */
const parseMarketResponse = async (
  markets: Market[]
): Promise<LyraMarket[]> => {
  return await Promise.all(
    markets.map(async (market) => {
      const { address, name, isPaused } = market
      const liveBoards: LyraBoard[] = parseMarketBoards(market.liveBoards())
      const liveBoardsWithQuotedStrikes: LyraBoard[] = await parseBoardStrikes(
        liveBoards
      )
      console.log({ liveBoardsWithQuotedStrikes })
      return {
        address,
        name,
        isPaused,
        liveBoards: liveBoardsWithQuotedStrikes,
      }
    })
  )
}

const parseMarketBoards = (boards: Board[]): LyraBoard[] => {
  return boards.map((board) => {
    const { id, expiryTimestamp, baseIv } = board
    const marketName = board.market().name
    const strikes: Strike[] = board
      .strikes()
      .filter((strike) => strike.isDeltaInRange)
    const name = formatBoardName(expiryTimestamp)
    return { name, id, expiryTimestamp, baseIv, strikes, marketName }
  })
}

const parseBoardStrikes = async (boards: LyraBoard[]) => {
  return await Promise.all(
    boards.map(async (board) => {
      const { strikes, marketName } = board

      const strikesLongCallQuotes = await formatStrikeWithQuote(
        marketName,
        strikes,
        true, // isCall
        true // isBuy
      )
      const strikesLongPutQuotes = await formatStrikeWithQuote(
        marketName,
        strikes,
        false,
        true
      )
      const strikesShortCallQuotes = await formatStrikeWithQuote(
        marketName,
        strikes,
        true,
        false
      )
      const strikesShortPutQuotes = await formatStrikeWithQuote(
        marketName,
        strikes,
        false,
        false
      )

      return {
        ...board,
        strikesByOptionTypes: {
          0: strikesLongCallQuotes,
          1: strikesLongPutQuotes,
          3: strikesShortCallQuotes,
          4: strikesShortPutQuotes,
        },
      }
    })
  )
}

const formatStrikeWithQuote = async (
  marketName: string,
  strikes: Strike[],
  isCall: boolean,
  isLong: boolean
) => {
  return await Promise.all(
    strikes.map(async (strike: Strike) => {
      const quote = await strike.quote(isCall, isLong, ONE_BN)
      return { ...strike, quote, market: marketName }
    })
  )
}

const formatBoardName = (expiryTimestamp: number) => {
  const date = new Date(expiryTimestamp * 1000)
  const month = MONTHS[date.getMonth()]
  const day = date.getDate()
  const hours = date.getHours()
  return `Expires ${month} ${day}, ${hours}:00`
}
