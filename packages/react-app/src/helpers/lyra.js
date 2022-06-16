import Lyra from '@lyrafinance/lyra-js'
import { BigNumber } from 'ethers';import { formatUnits } from 'ethers/lib/utils';
;

const LyraConfig = {
  rpcUrl: 'https://optimism-kovan.infura.io/v3/db5ea6f9972b495ab63d88beb08b8925',
  chainId: 69
};

export const lyra = new Lyra(LyraConfig);

export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => {
  const markets = await lyra.markets();
  console.log({ markets })
  const lyraMarket = await lyra.market(market);
  console.log({ lyraMarket });
  return lyraMarket; 
}; // 'eth'

export const getQuoteBoard = async (marketName, boardId, sizeSelected) => {


  // const data = await lyra.markets()
  // const market = data[0]
  // const strike = market.liveBoards()[0].strikes()[1]
  // const quote = await strike.quote(true, false, BigNumber.from(1))
  // console.log({
  //   size: formatUnits(quote.size),
  //   pricePerOption: formatUnits(quote.pricePerOption),
  //   premium: formatUnits(quote.premium),
  //   fee: quote.fee,
  // })


  const quotes = await lyra.quoteBoard(marketName, boardId, sizeSelected); 
  return quotes.map(({ ask, bid, option }) => {
    const { __strike: { id } } = option; 

    return {
      strikeId: id, 
      ask,
      bid
    }
  })

}

