import { useQuery } from 'react-query'

import Lyra, { Board, Market, Quote, Strike, AccountPortfolioBalance, PositionPnl } from '@lyrafinance/lyra-js'
import { BigNumber, ethers } from 'ethers'
import QUERY_KEYS from '../../constants/queryKeys'
import { MONTHS } from '../../constants/dates'
import { ONE_BN } from '../../constants/bn'
import { useWeb3Context } from '../../context'
import { LyraBoard, LyraMarket, LyraStrike } from '../../utils/types/lyra'

export const useLyra = () => {
  const { network } = useWeb3Context()
  const provider = new ethers.providers.InfuraProvider(10, process.env.INFURA_ID);
  const lyra = new Lyra({ provider });
  return lyra;
}

export const useLyraMarket = () => {
  const lyra = useLyra();

  return useQuery<LyraMarket[] | null>(
    QUERY_KEYS.Lyra.Markets(),
    async () => {
      const response: Market[] = await lyra.markets()
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
  const lyra = useLyra();

  return useQuery<Strike>(
    QUERY_KEYS.Lyra.Strike(market, strikeId),
    async () => {
      const response = await lyra.strike(market, strikeId)
      return response
    },
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )
}

export const getStrikeQuote = async (
  lyra: Lyra,
  trade: LyraStrike,
  optionType: number,
  size: BigNumber
) => {
  const [isCall, isBuy] = OPTION_TYPES[optionType]
  const marketName = trade.market
  const _strike = await lyra.strike(marketName, trade.id)
  const quote = await _strike.quote(isCall, isBuy, size)
  return {
    ..._strike,
    quote,
    selectedOptionType: optionType,
    market: marketName,
  }
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
      const liveBoardsWithQuotedStrikes: any[] = await parseBoardStrikes(
        liveBoards
      )
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
      .sort(sortStrikes)
    const name = formatBoardName(expiryTimestamp)
    return { name, id, expiryTimestamp, baseIv, strikes, marketName }
  })
}

const sortStrikes = (a: Strike, b: Strike) => {
  return a.strikePrice.gte(b.strikePrice) ? 1 : 0
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

type OPTION_TYPE = {
  [key: number]: boolean[]
}

const OPTION_TYPES: OPTION_TYPE = {
  0: [true, true], // buy call
  1: [false, true], // buy put
  2: [true, false], // sell covered call
  3: [true, false], // sell call
  4: [false, false], // sell put
}