import Lyra from '@lyrafinance/lyra-js'
import { BigNumber } from 'ethers';;

const lyra = new Lyra();

// Fetch all markets
export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => await lyra.market(market); // 'eth'

export const getQuoteBoard = async (marketName, boardId) => {
  const quotes = await lyra.quoteBoard(marketName, boardId, BigNumber.from(1)); 
  return quotes.map(({ ask, option }) => {
    const { __strike: { id } } = option; 
    const { premium, pricePerOption } = ask; 
    return {
      strikeId: id, 
      premium,
      pricePerOption
    }
  })
}
