import { useVaultManagerContext } from '../context'
import { useCallback, useEffect, useState } from 'react'
import { fromBigNumber } from '../utils/formatters/numbers'
import { BigNumber } from 'ethers'

type Ticks = {
  [key: number]: { profitAtTick: number }
}

type PnlChartPoint = {
  name: number
  asset_price: number
  combo_payoff: number
}

export const useProfitLossChart = (asset: string, priceOfAsset: number) => {

  const { builtTrades } = useVaultManagerContext();
  const [data, setData] = useState<PnlChartPoint[] | []>([]);

  const formattedChartData = useCallback(() => {
    if (builtTrades && builtTrades?.length > 0) {
      const _ticks = ticks(asset, priceOfAsset);
      const _combo: Ticks = _ticks.reduce((accum, tick) => {
        const profitAtTick = formatProfitAndLostAtTicks(tick, builtTrades);
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
      setData(_chartData);
    }
  }, [builtTrades, priceOfAsset, asset])

  useEffect(() => {
    if (builtTrades && builtTrades?.length > 0) {
      formattedChartData();
    }
  }, [builtTrades, priceOfAsset, asset])

  return data;
}

const ticks = (asset: string, price: number) => {
  const ticks = [];

  let multiple = asset == 'ETH' ? 1.5 : 1.1;
  let tickSize = asset == 'ETH' ? 1 : 10;

  let lowerBound = price / multiple;
  let upperBound = price * multiple;

  let currentTick = lowerBound;

  while (currentTick < upperBound) {
    currentTick = currentTick + tickSize;
    ticks.push(currentTick);
  };

  return ticks;
}

const formatProfitAndLostAtTicks = (tick: number, strikes: any[]) => {
  return strikes.reduce((accum: number, strike: any) => {
    const { strikePrice, quote: { size, isCall, isBuy, pricePerOption } } = strike;
    const totalPriceForOptions = fromBigNumber(pricePerOption) * fromBigNumber(size);
    const totalSumOfFees = isBuy ? -totalPriceForOptions : totalPriceForOptions;
    const profitAtTick = calculateProfitAtTick(totalSumOfFees, strikePrice, tick, isCall, isBuy, fromBigNumber(size)) // can be negative or positive dependent on option type
    accum = accum + profitAtTick;
    return accum;
  }, 0);
}

const calculateProfitAtTick = (totalSumOfFees: number, _strikePrice: BigNumber, tick: number, isCall: boolean, isBuy: boolean, size: number): number => {
  const strikePrice = fromBigNumber(_strikePrice);
  let profitAtTick = 0;

  if (isBuy) {
    if (isCall) {
      if (tick < strikePrice) {
        profitAtTick = totalSumOfFees;
      } else {
        profitAtTick = ((tick - strikePrice) * size) - totalSumOfFees // (tick - (strikePrice - (totalSumOfFees))) * size; // 1200 - 1150 = 50 - 60 = -10 
      }
    } else {
      if (tick < strikePrice) {
        profitAtTick = ((strikePrice - tick) * size) - totalSumOfFees  // (strikePrice - (tick + totalSumOfFees)) * size; // 1200 - 
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

  return profitAtTick;
}