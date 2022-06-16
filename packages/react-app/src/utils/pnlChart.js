import { getLyraMarket, getQuoteBoard } from "../helpers/lyra";

const priceOfAsset = 1050; 

const getTicks = () => {
  const ticks = [];

  let currentTick = priceOfAsset / 2; 

  while(currentTick < priceOfAsset * 2) {
    ticks.push(currentTick + .01); 
  };

  return ticks; 
}

const calculateProfit = (tick) => { // get lyra from sdk 
  
}

const calculateFees = async (strikes) => {

  const results = await Promise.all(strikes.map(async strike => {
    const quote = await strike.quote(true, false, ONE_BN.div(100));
    return quote; 
  }))

  console.log({ results }); 

}

const calculateCombo = (tick) => {
  
}

const data1 = getTicks().map((tick, index) => {
  return {
    name: index,
    asset_price: tick,
    expected_payoff0: 200, 
    expected_payoff1: -400,
    combo_payoff: -200, // from sell call
  }
}) 