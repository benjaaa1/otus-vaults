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
import { formatUSD, fromBigNumber } from "../../../../utils/formatters/numbers";

export const PNLChart = ({ assetType }: { assetType: string }) => {

  const { data: currentPrice } = useLatestRates(assetType);

  const data = useProfitLossChart(assetType, currentPrice || 0);

  return (
    <LineChart
      width={250}
      height={220}
      data={data}
      margin={{
        top: 2,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <XAxis hide={true} dataKey="asset_price" />
      <YAxis hide={true} label="profit" />
      {/* @ts-ignore */}
      <Tooltip content={<CustomTooltip currentPrice={currentPrice} />} />
      {/**
       * x is liquidation spots
       */}
      {/* <ReferenceLine x={2750} stroke="red" />
      <ReferenceLine x={3050} stroke="red" /> */}


      {/* <ReferenceLine label="test" x={1200} stroke={'#fff'} alwaysShow={true} /> */}
      <ReferenceLine y={0} stroke={'#e4e4e7'} strokeWidth={.25} />

      {/* <ReferenceDot key={'1'} x={-2} y={2} /> */}

      <Line type="monotone" dataKey="combo_payoff" stroke={'#047857'} dot={false} />

      {/* <Line type="monotone" dataKey="asset_price" stroke="#8884d8" /> */}
    </LineChart>
  );
}

const CustomTooltip = ({ currentPrice, active, payload, label }: { currentPrice: number, active: boolean, payload: any, label: number }) => {
  if (active && payload && payload.length) {
    return <div className="grid grid-cols-2">
      <div className="col-span-2 grid-cols-1">
        <div>
          <p className="truncate font-sans text-xs font-medium text-white">
            Asset Price At
          </p>
        </div>
        <div>
          <p className="font-mono text-xs font-normal leading-5 text-white">
            {formatUSD(label)}
          </p>
        </div>
      </div>

      <div className="col-span-2 grid-cols-1">
        <div>
          <p className="truncate font-sans text-xs font-medium text-white">
            Profit/Loss
          </p>
        </div>
        <div>
          {
            payload[0].value > 0 ?
              <p className="font-mono text-xs font-bold leading-5 text-emerald-700">
                {formatUSD(payload[0].value)}
              </p> :
              <p className="font-mono text-xs font-bold leading-5 text-pink-900">
                {formatUSD(payload[0].value)}
              </p>
          }

        </div>
      </div>

      <div className="col-span-2 grid-cols-1">
        <div>
          <p className="truncate font-sans text-xs font-medium text-white">
            Current Price
          </p>
        </div>
        <div>
          <p className="font-mono text-xs font-normal leading-5 text-white">
            {formatUSD(currentPrice)}
          </p>
        </div>
      </div>

    </div>
  }

  return null;
};