import { useVaultManagerContext } from '../context'
import { useCallback, useEffect, useState } from 'react'
import { fromBigNumber } from '../utils/formatters/numbers'

export const useProfitLossChart = (priceOfAsset: number) => {

  const { builtTrades } = useVaultManagerContext();
  const [data, setData] = useState([]);

  const formattedChartData = useCallback(() => {
    if (builtTrades && builtTrades?.length > 0) {
      const _ticks = ticks(priceOfAsset);
      const _combo = _ticks.reduce((accum, tick) => {
        const profitAtTick = formatProfitAndLostAtTicks(tick, builtTrades);
        console.log({ profitAtTick })
        return { ...accum, [tick]: { profitAtTick } }
      }, {})
      const _chartData = _ticks.map((tick, index) => {
        const profitAtTick = _combo[tick].profitAtTick;
        return {
          name: index,
          asset_price: tick,
          combo_payoff: profitAtTick
        }
      })
      console.log({ _chartData })
      setData(_chartData);
    }
  }, [builtTrades, priceOfAsset])

  useEffect(() => {
    if (builtTrades && builtTrades?.length > 0) {
      formattedChartData();
    }
  }, [builtTrades])
  console.log({ data })
  return data;
}

const ticks = (price: number) => {
  const ticks = [];

  let lowerBound = price / 1.5;
  let upperBound = price * 1.5;

  let currentTick = lowerBound;

  while (currentTick < upperBound) {
    currentTick = currentTick + 1;
    ticks.push(currentTick);
  };

  return ticks;
}

const formatProfitAndLostAtTicks = (tick: number, strikes) => {
  return strikes.reduce((accum, strike) => {
    const { strikePrice, quote: { size, isCall, isBuy, pricePerOption } } = strike;
    const totalPriceForOptions = fromBigNumber(pricePerOption) * fromBigNumber(size);
    const totalSumOfFees = isBuy ? -totalPriceForOptions : totalPriceForOptions;
    const profitAtTick = calculateProfitAtTick(totalSumOfFees, strikePrice, tick, isCall, isBuy) // can be negative or positive dependent on option type
    accum = accum + profitAtTick;
    console.log({ accum })
    return accum;
  }, 0);
}

const calculateProfitAtTick = (totalSumOfFees, _strikePrice, tick, isCall, isBuy) => {
  const strikePrice = fromBigNumber(_strikePrice) // Math.round(parseFloat(fromBigNumber(_strikePrice)));
  let profitAtTick;

  if (isBuy) {
    if (isCall) {
      if (tick < strikePrice) {
        profitAtTick = totalSumOfFees;
      } else {
        profitAtTick = tick - (strikePrice - (totalSumOfFees));
      }
    } else {
      if (tick < strikePrice) {
        profitAtTick = strikePrice - (tick + totalSumOfFees);
      } else {
        profitAtTick = totalSumOfFees;
      }
    }
  }

  if (!isBuy) {
    if (isCall) {
      if (tick < strikePrice) {
        profitAtTick = totalSumOfFees;
      } else {
        profitAtTick = (strikePrice + totalSumOfFees) - tick;
      }

    } else {
      if (tick < strikePrice) {
        profitAtTick = tick - strikePrice + (totalSumOfFees);
      } else {
        profitAtTick = totalSumOfFees;
      }
    }
  }

  console.log({ profitAtTick, totalSumOfFees, strikePrice, isCall, isBuy, tick })

  return profitAtTick;
}