import Lyra from '@lyrafinance/lyra-js';

export const lyra = new Lyra(69);

export const getStrike = async (strikeId) => await lyra.strike('ETH', strikeId);

export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => {
  const markets = await lyra.markets();
  console.log({ markets })
  const lyraMarket = await lyra.market(market);
  console.log({ lyraMarket });
  return lyraMarket; 
}; // 'eth'

export const getQuoteBoard = async (marketName, boardId, sizeSelected) => {
  const quotes = await lyra.quoteBoard(marketName, boardId, sizeSelected); 
  return quotes.map((test) => {
    const { ask, bid, option } = test; 
    const { __strike: { id } } = option; 
    return {
      strikeId: id, 
      ask,
      bid
    }
  })

}

