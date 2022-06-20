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
import colors from "../../designSystem/colors";

export const SupervisorChart = ({ data, currentPrice }) => {
  console.log({ data, currentPrice })
  return (
    <LineChart
      width={340}
      height={220}
      data={data}
      margin={{
        top: 20,
        right: 20,
        left: 20,
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

      <ReferenceLine x={currentPrice} stroke={colors.background.three} />
      <ReferenceLine y={0} stroke={colors.background.three} />

      {/* <ReferenceDot key={'1'} x={-2} y={2} /> */}

      <Line type="monotone" dataKey="combo_payoff" stroke={colors.borderGray} dot={false} />

      {/* <Line type="monotone" dataKey="asset_price" stroke="#8884d8" /> */}
    </LineChart>
  );
}

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