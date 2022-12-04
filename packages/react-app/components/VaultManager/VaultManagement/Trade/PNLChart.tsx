import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot
} from "recharts";
import { useProfitLossChart } from "../../../../hooks/ProfitLossChart";
import { useLatestRates } from "../../../../queries/synth/useLatestRates";

export const PNLChart = () => {

  const { data: currentPrice } = useLatestRates('eth');

  const data = useProfitLossChart(currentPrice || 0);

  return (
    <LineChart
      width={310}
      height={220}
      data={data}
      margin={{
        top: 0,
        right: 20,
        bottom: 20
      }}
    >
      <XAxis hide={true} dataKey="asset_price" />
      <YAxis hide={true} label="profit" />
      <Tooltip />
      {/**
       * x is liquidation spots
       */}
      {/* <ReferenceLine x={2750} stroke="red" />
      <ReferenceLine x={3050} stroke="red" /> */}

      <ReferenceLine x={currentPrice} stroke={'#fff'} />
      <ReferenceLine y={0} stroke={'#e4e4e7'} />

      {/* <ReferenceDot key={'1'} x={-2} y={2} /> */}

      <Line type="monotone" dataKey="combo_payoff" stroke={'#047857'} dot={false} />

      {/* <Line type="monotone" dataKey="asset_price" stroke="#8884d8" /> */}
    </LineChart>
  );
}
