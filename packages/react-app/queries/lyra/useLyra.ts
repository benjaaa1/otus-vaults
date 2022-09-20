import { useQuery } from 'react-query';

import Lyra, { Board, Market, Strike } from '@lyrafinance/lyra-js';
import { BigNumber } from 'ethers';
import QUERY_KEYS from '../../constants/queryKeys';


const isProduction = true //process.env.NODE_ENV === "production";

export const lyra = isProduction ? new Lyra() : new Lyra(69);

export const getLyraMarkets = async () => await lyra.markets();

type LyraMarket = {
  address: string;
  name: string;
	liveBoards: Board[]
}

// type LyraStrike = {
//   id: number;
//   strikePrice: BigNumber;
// } 

export const useLyraMarket = () => {
	console.log('lyra market')
	return useQuery<LyraMarket[] | null>(
		QUERY_KEYS.Lyra.Markets(),
		async () => {
			const response: Market[] = await lyra.markets();
      console.log({ response })
      return response ? parseMarketResponse(response) : null; 
		},
		{
			refetchInterval: false,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		}
	);
};

export const useStrikes = (market: string, strikeId: number) => {
	return useQuery<Strike>(
		QUERY_KEYS.Lyra.Strike(market, strikeId),
		async () => {
			const response = await lyra.strike(market, strikeId);
      console.log({ response })
      return response; 
		},
		{
			refetchInterval: false,
			refetchOnWindowFocus: false,
			refetchOnMount: false,
		}
	);
};

const parseMarketResponse = (markets: Market[]): LyraMarket[] => {
	return markets.map(market => {
		const { address, name } = market; 
		const liveBoards = market.liveBoards(); 
		return { address, name, liveBoards }
	});
}