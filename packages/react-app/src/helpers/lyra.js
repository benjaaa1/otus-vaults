import Lyra from '@lyrafinance/lyra-js';

const LyraConfig = {
  rpcUrl: 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925',
  chainId: 69
};

export const lyra = new Lyra(LyraConfig);

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

