import { useQuery } from 'react-query'

import Lyra, { Board, Market, Quote, Strike } from '@lyrafinance/lyra-js'
import { BigNumber } from 'ethers'
import QUERY_KEYS from '../../constants/queryKeys'
import { MONTHS } from '../../constants/dates'
import { ONE_BN } from '../../constants/bn'

const isProduction = true //process.env.NODE_ENV === "production";

export const lyra = isProduction ? new Lyra() : new Lyra(69)

export const getLyraMarkets = async () => await lyra.markets()

export type LyraStrike = {
  selectedOptionType?: number
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
}

export type LyraMarket = {
  address: string
  name: string
  isPaused: boolean
  liveBoards: LyraBoard[]
}

export const useLyraMarket = () => {
  console.log('lyra market')
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
    const strikes: Strike[] = board
      .strikes()
      .filter((strike) => strike.isDeltaInRange)
    const name = formatBoardName(expiryTimestamp)
    return { name, id, expiryTimestamp, baseIv, strikes }
  })
}

const parseBoardStrikes = async (boards: LyraBoard[]) => {
  return await Promise.all(
    boards.map(async (board) => {
      const { strikes } = board

      const strikesLongCallQuotes = await formatStrikeWithQuote(
        strikes,
        true,
        true
      )
      const strikesLongPutQuotes = await formatStrikeWithQuote(
        strikes,
        false,
        true
      )
      const strikesShortCallQuotes = await formatStrikeWithQuote(
        strikes,
        true,
        false
      )
      const strikesShortPutQuotes = await formatStrikeWithQuote(
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
  strikes: Strike[],
  isCall: boolean,
  isLong: boolean
) => {
  return await Promise.all(
    strikes.map(async (strike: Strike) => {
      const quote = await strike.quote(isCall, isLong, ONE_BN)
      return { ...strike, quote }
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
