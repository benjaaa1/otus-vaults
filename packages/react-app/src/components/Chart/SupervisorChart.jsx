// expected profit ~ $20

// ----------------

// range of price of asset ~ eth 100 - 2000

// -----------------------------------

// reference line - eth price now ~ eth at 900 - mouse moves around price to update view on expected profit

//    |
//    |
//    |
//    |
//    |
//    |

// line payoff - expected profit increases or decreases depending on option strategy 

//      \
//       \
//        \
//         \
//          \
//           \
//            \
//             \

// reference line at liquidation price 

//              |
//              |
//              |
//              |
//              |
//              |
        
// {"x":306.9306930693069,"y":101.57084792520276,"value":-1690.6279834264844,"payload":{"x":3110.422265624993,"payoff":-1690.6279834264844}}

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

const data = [
  {
    name: -3,
    asset_price: 2700,
    expected_payoff0: -300, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: -100, // from sell call
    amt: 2400
  },
  {
    name: -2,
    asset_price: 2750,
    expected_payoff0: -200, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: 0, // from sell call
    amt: 2400
  },
  {
    name: -1,
    asset_price: 2800,
    expected_payoff0: 0, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: 200, // from sell call
    amt: 2400
  },
  {
    name: 0,
    asset_price: 2850,
    expected_payoff0: 200, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: 400, // from sell call
    amt: 2400
  },
  {
    name: 1,
    asset_price: 2900,
    expected_payoff0: 200, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: 400, // from sell call
    amt: 2400
  },
  {
    name: 2,
    asset_price: 2950,
    expected_payoff0: 200, // from sell put
    expected_payoff1: 200, // from sell call
    combo_payoff: 400, // from sell call
    amt: 2400
  },
  {
    name: 3,
    asset_price: 3000,
    expected_payoff0: 200, // from sell put
    expected_payoff1: 0, // from sell call
    combo_payoff: 200, // from sell call
    amt: 2400
  },
  {
    name: 4,
    asset_price: 3050,
    expected_payoff0: 200,
    expected_payoff1: -200,
    combo_payoff: 0, // from sell call
    amt: 2210
  },
  {
    name: 5,
    asset_price: 3100,
    expected_payoff0: 200,
    expected_payoff1: -300,
    combo_payoff: -100, // from sell call
    amt: 2210
  },
  {
    name: 6,
    asset_price: 3150,
    expected_payoff0: 200,
    expected_payoff1: -400,
    combo_payoff: -200, // from sell call
    amt: 2210
  }
];

const priceOfAsset = 1050; 

const getTicks = () => {
  const ticks = [];

  let currentTick = priceOfAsset / 2; 
  let upperBoundOfPrice = priceOfAsset * 2; 

  while(currentTick < upperBoundOfPrice) {
    currentTick = currentTick + 1; 
    ticks.push(currentTick); 
  };

  return ticks; 
}

const calculateProfit = (tick) => { // get lyra from sdk 
  
}

// const calculateFees = async (strikes) => {

//   const results = await Promise.all(strikes.map(async strike => {
//     const quote = await strike.quote(true, false, ONE_BN.div(100));
//     return quote; 
//   }))

//   console.log({ results }); 

// }

// const calculateCombo = (tick) => {
  
// }

const data1 = getTicks().map((tick, index) => {
  return {
    name: index,
    asset_price: tick,
    expected_payoff0: 200, 
    expected_payoff1: -400,
    combo_payoff: -200, // from sell call
  }
}) 

// console.log({ data1 }); 
// how to produce this data 

// get current price - draw reference point (reference line)
// decide range of pricing to show on x axis
// -200% +200%

// for each tick decided -> 
// calculate profit (sum of)
// calculate fees (sum of)
// calculate profit after fees for each tick

// if using collatPercent
// calculate liquidation prices if multiple strikes 

export const SupervisorChart = () => {

  console.log({ data1: data1 })
  return (
    <LineChart
      width={400}
      height={300}
      data={data}
      margin={{
        top: 20,
        right: 50,
        left: 20,
        bottom: 5
      }}
    >
      <XAxis hide={true} dataKey="asset_price" />
      <YAxis hide={true} label="profit" />
      <Tooltip />
      <Legend />
      {/**
       * x is liquidation spots
       */}
      <ReferenceLine x={2750} stroke="red" />
      <ReferenceLine x={3050} stroke="red" />

      <ReferenceLine y={400} stroke="red" />
      <ReferenceLine y={0} stroke="red" />

      <ReferenceDot key={'1'} x={-2} y={2} />

      <Line type="monotone" dataKey="combo_payoff" stroke="#8884d8" />

      {/* <Line type="monotone" dataKey="asset_price" stroke="#8884d8" /> */}
    </LineChart>
  );
}


// const data1 = [
//   {
//     name: 20,
//     asset_price: 3000,
//     expected_payoff: 20,
//     amt: 2400,
//   },
//   {
//     name: 20,
//     asset_price: 3000,
//     expected_payoff: -1398,
//     amt: 2210,
//   }
// ]

// referenceLinesProps = []
// referenceLinesProp = {
//   viewBox: null,
//   xAxisId: null, 
//   yAxisId: null,
//   id: null, 
//   isFront: true, 
//   yAxis: null,
//   xAxis: null,
//   segement: null
// }
// referenceDotProps = []
// referenceDotProp = {
//   x: null,
//   y: null, 
// }
// dataKeys = []
// dataKey = {
//   key: null, 
//   activeDot: null, 
//   opacity: null, 
//   strokeWidth: null, 
//   strokeColor: null, 
//   strokeDasharray: null,
//   dot: false
// }