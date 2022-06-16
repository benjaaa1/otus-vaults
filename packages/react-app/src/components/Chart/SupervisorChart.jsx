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

export const SupervisorChart = ({ data }) => {
  console.log({ data })
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
      {/* <ReferenceLine x={2750} stroke="red" />
      <ReferenceLine x={3050} stroke="red" /> */}

      <ReferenceLine x={1050} stroke="red" />
      <ReferenceLine y={0} stroke="red" />

      {/* <ReferenceDot key={'1'} x={-2} y={2} /> */}

      <Line type="monotone" dataKey="combo_payoff" stroke="#8884d8" />

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