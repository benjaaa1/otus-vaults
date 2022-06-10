import Lyra from '@lyrafinance/lyra-js'
import { BigNumber } from 'ethers';;

const LyraConfig = {
  rpcUrl: 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925',
  chainId: 69
};

const lyra = new Lyra(LyraConfig);

console.log({ lyra })
// Fetch all markets
export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => {
  const markets = await lyra.markets();
  console.log({ markets })
  const lyraMarket = await lyra.market(market);
  console.log({ lyraMarket });
  return lyraMarket; 
}; // 'eth'

export const getQuoteBoard = async (marketName, boardId) => {
  const quotes = await lyra.quoteBoard(marketName, boardId, BigNumber.from(1)); 
  return quotes.map(({ ask, bid, option }) => {
    const { __strike: { id } } = option; 
    console.log({ bid });
    const { premium, pricePerOption } = ask; 
    return {
      strikeId: id, 
      premium,
      pricePerOption
    }
  })
}
