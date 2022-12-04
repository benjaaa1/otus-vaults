import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { UNIT } from "../constants/bn";
import { getLyraMarket, getQuoteBoard, lyra } from "../helpers/lyra";

const priceOfAsset = 1150; 

const getTicks = () => {
  const ticks = [];

  let lowerBound = priceOfAsset / 2; 
  let upperBound = priceOfAsset * 2; 

  let currentTick = lowerBound; 

  while(currentTick < upperBound) {
    currentTick = currentTick + 1; 
    ticks.push(currentTick); 
  };

  return ticks; 
}

const calculateFees = async (strike, isCall, isBuy, size) => {
  const quote = await strike.quote(isCall, isBuy, size);
  const { feeComponents: { optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee }, pricePerOption } = quote; 
  const totalPriceForOptions = parseFloat(pricePerOption / (10 ** 18)) * formatUnits(size);
  return { 
    optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee, pricePerOption, totalPriceForOptions
  }
}

const sumOfCost = (fee) => {
  const { totalPriceForOptions } = fee; 
  const sum = totalPriceForOptions // optionPriceFee;
  return -sum; 
}

const sumOfMinReceived = (fee) => {
  const { totalPriceForOptions } = fee; 
  const sum = totalPriceForOptions;
  return sum; 
}

const calculateProfitAtTick = (totalSumOfFees, _strikePrice, tick, isCall, isBuy) => {

  // const totalSumOfFees = Math.round(parseFloat(_totalSumOfFees / (10 ** 18)));
  const strikePrice = Math.round(parseFloat(formatUnits(_strikePrice)));

  let profitAtTick; 
  // is buy 

  if(isBuy) {
    if(isCall) {
      // tick at 1000 - need strike price ex. 1200 - cost for buy call $20 if tick < strike price fixed loss if tick > strike price profit after cost
      if(tick < strikePrice) {
        profitAtTick = totalSumOfFees; 
      } else {
        profitAtTick = tick - (strikePrice - (totalSumOfFees));
      }

    } else {
      // tick at 1000 - need strike price ex. 1400 -  cost for buy put $20 if tick > strike price loss if tick < strike price infinte profit
      if(tick < strikePrice) {
        profitAtTick = strikePrice - (tick + totalSumOfFees); 
      } else {
        profitAtTick = totalSumOfFees; 
      }
    }
  }

  // is sell
  if(!isBuy) {
    if(isCall) {

      // tick at 1000 - need strike price ex. 1400 - profit for strike sell call $100 
      if(tick < strikePrice) {
        profitAtTick = totalSumOfFees; 
      } else {
        // tick 1001 strike price 1000 premium is 50
        // 1000 + 50 - 1001

        // tick 1500 strike price 1000 premium is 50
        // 1000 + 50 - 1500 // -450
        profitAtTick = (strikePrice + totalSumOfFees) - tick; 
      }

    } else {

      // tick at 900 - need strike price ex. 1050 - profit for strike sell put $100 
      if(tick < strikePrice) {
        // 999 strike is 1000 premium is 50 
        // profit would be 49
        // 998 48
        // 990 40
        // 950 0

        profitAtTick = tick - strikePrice + (totalSumOfFees); 
      } else {
        profitAtTick = totalSumOfFees;
      }
    }
  }

  return profitAtTick; 
}

// update
// get sum of fees outside of calcualteCombo to avoid o(n)
const calculateCombo = (tick, strikes) => {
  return strikes.reduce((accum, strike) => {
    const { isCall, isBuy, strikePrice } = strike; 
    const totalSumOfFees = isBuy ? sumOfCost(strike) : sumOfMinReceived(strike);
    const profitAtTick = calculateProfitAtTick(totalSumOfFees, strikePrice, tick, isCall, isBuy) // can be negative or positive dependent on option type
    accum = accum + profitAtTick; 
    return accum; 
  }, 0);
}

// before getting data 
// get strike 
// get fees 

export const data1 = async (strikesSelected, _size) => {

  if(strikesSelected.length == 0) {
    return [
      [],
      {
        maxCost: 0,
        minReceived: 0,
        maxLoss: 0,
        breakEvent: 0,
        total: 0
      }
    ];
  }

  const _strikes = strikesSelected.filter(({ _strike }) => (_strike != null && _strike.id != null)).map(({_strike}) => _strike);

  if(_strikes.length == 0) {
    return [
      [],
      {
        maxCost: 0,
        minReceived: 0,
        maxLoss: 0,
        breakEvent: 0,
        total: 0
      }
    ];
  }

  const strikesWithFees =  await Promise.all(strikesSelected.filter(({_strike}) => _strike != null).map(async ({_strike, isCall, isBuy}) => {
    const size = BigNumber.from(_size).mul(UNIT);
    const strike = await lyra.strike('eth', _strike.id);
    const { optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee, pricePerOption, totalPriceForOptions } = await calculateFees(strike, isCall, isBuy, size ); 

    return {
      strikePrice: strike.strikePrice,
      id: _strike.id, 
      isCall, 
      isBuy,
      optionPriceFee, 
      spotPriceFee, 
      varianceFee, 
      vegaUtilFee, 
      pricePerOption,
      totalPriceForOptions
    }
  })).then(values => {
    return values; 
  });

  const ticks = getTicks(); 

  const combo = ticks.reduce((accum, tick) => {
    const profitAtTick = calculateCombo(tick, strikesWithFees);
    return { ...accum, [tick]: { profitAtTick } }
  }, {});

  const chartData = ticks.map((tick, index) => {
    return {
      name: index,
      asset_price: tick,
      combo_payoff: combo[tick].profitAtTick
    }
  }) 

  const maxCost = calculateSum(strikesWithFees.filter(({ isBuy }) => isBuy == true)); 
  const minReceived = calculateSum(strikesWithFees.filter(({ isBuy }) => isBuy == false)); 

  const transactionData = {
    maxCost: -(maxCost),
    minReceived: minReceived,
    maxLoss: 0,
    breakEvent: 0,
    total: 0
  }
  return [chartData, transactionData]
}

const calculateSum = (strikes) => {
  return strikes.reduce((accum, strike) => {
    const { isBuy } = strike; 
    const _totalSumOfFees = isBuy ? sumOfCost(strike) : sumOfMinReceived(strike);
    accum = accum + _totalSumOfFees; 
    return accum; 
  }, 0);

}
