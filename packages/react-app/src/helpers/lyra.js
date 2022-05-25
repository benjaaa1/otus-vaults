import Lyra from '@lyrafinance/lyra-js'

const lyra = new Lyra();

// Fetch all markets
export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => await lyra.market(market); // 'eth'
