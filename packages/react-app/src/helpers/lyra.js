import Lyra from '@lyrafinance/lyra-js'

const lyra = new Lyra();

// Fetch all markets
export const getLyraMarkets = async () => await lyra.markets();

export const getLyraMarket = async (market) => await lyra.market(market); // 'eth'

// export const marketDeploys = async (market) => await getMarketDeploys('kovan-ovm', market); 

// export const markets = async () => await lyra.markets()

// Select most recent expiry
// export const getLyraMarketBoard = async (market) = market.liveBoards()[0];

// // Select first strike in delta range
// const strike = board.strikes().find(strike => strike.isDeltaInRange)
// if (!strike) {
//   throw new Error('No strike in delta range')
// }


// // console.log(
//   markets.map(market => ({
//     address: market.address,
//     name: market.name,
//     // List all live boards (expiries)
//     expiries: market.liveBoards().map(board => ({
//       id: board.id,
//       expiryTimestamp: board.expiryTimestamp,
//       // List all strikes
//       strikes: board.strikes().map(strike => ({
//         id: strike.id,
//         strikePrice: strike.strikePrice,
//       })),
//     })),
//   }))
// )