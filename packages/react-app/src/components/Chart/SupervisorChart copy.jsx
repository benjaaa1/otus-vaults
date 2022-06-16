import Box from '@lyra/ui/components/Box'
import useThemeColor from '@lyra/ui/hooks/useThemeColor'
import React from 'react'
import {
  Line,
  LineChart as RechartsLineChart,
  LineProps,
  ReferenceDot,
  ReferenceDotProps,
  ReferenceLine,
  ReferenceLineProps as RechartsReferenceLineProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AxisDomain as RechartsAxisDomain, Margin } from 'recharts/types/util/types'
import { LayoutProps, MarginProps } from 'styled-system'

import Text from '../Text'

export type ReferenceLineProps = RechartsReferenceLineProps
export type AxisDomain = RechartsAxisDomain

export type CustomLineChartKey<LineData> = {
  label: string
  key: keyof LineData
  strokeColor: string
  strokeWidth?: number
  opacity?: number
  strokeDasharray?: string
  activeDot?: boolean | React.ReactNode
}

export type DataPoint = {
  [key: string]: number
}

type Props<T extends DataPoint> = {
  domain?: AxisDomain
  range?: AxisDomain
  // Array of objects
  data: T[]
  // Descriptor for each line
  dataKeys: CustomLineChartKey<T>[]
  type: LineProps['type']
  hideXAxis?: boolean
  renderTooltip?: (payload: T) => React.ReactNode | string
  onClickArea?: (key: string) => void
  onHover?: (payload: T | null) => void
  onMouseLeave?: () => void
  referenceLinesProps?: ReferenceLineProps[]
  referenceDotProps?: ReferenceDotProps[]
  chartMargin?: Margin
  xAxisDataKey?: string
} & LayoutProps &
  MarginProps

export default function LineChart<T extends DataPoint>({
  data,
  dataKeys,
  domain,
  range,
  hideXAxis = true,
  onHover,
  renderTooltip,
  onMouseLeave,
  referenceLinesProps,
  referenceDotProps,
  type,
  chartMargin = { top: 24, bottom: 8 },
  xAxisDataKey = 'x',
  ...styleProps
}: Props<T>): JSX.Element {
  const background = useThemeColor('background')
  const label = useThemeColor('secondaryText')
  return (
    <Box {...styleProps}>
      <ResponsiveContainer width="100%" height="100%" minWidth={undefined}>
        <RechartsLineChart
          data={data}
          margin={chartMargin}
          onMouseLeave={() => {
            if (onMouseLeave) {
              onMouseLeave()
            } else if (onHover) {
              onHover(null)
            }
          }}
        >
          {hideXAxis ? null : <ReferenceLine y={0} stroke={label} />}
          <XAxis hide={true} dataKey={xAxisDataKey} type="number" domain={domain ?? ['dataMin', 'dataMax']} />
          <YAxis hide={true} type="number" domain={range ?? ['dataMin', 'dataMax']} />
          {renderTooltip ? (
            <Tooltip
              cursor={{ visibility: 'default', stroke: label }}
              allowEscapeViewBox={{ x: true, y: true }}
              isAnimationActive={false}
              offset={0}
              content={prop => {
                if (onHover && prop.payload && prop.payload.length) {
                  onHover(prop.payload[0].payload)
                }
                if (prop.payload && prop.payload.length) {
                  const tooltip = renderTooltip(prop.payload[0].payload)
                  return typeof tooltip === 'string' ? (
                    <Text variant="small" color="label" ml="-50%">
                      {tooltip}
                    </Text>
                  ) : (
                    tooltip
                  )
                }
                return null
              }}
              position={{ y: 0 }}
            />
          ) : null}
          {referenceLinesProps
            ? referenceLinesProps.map(referenceLineProps => (
                <ReferenceLine key={referenceLineProps.id} {...referenceLineProps} />
              ))
            : null}
          {referenceDotProps
            ? referenceDotProps.map(referenceDotProps => (
                <ReferenceDot key={referenceDotProps.id} {...referenceDotProps} />
              ))
            : null}
          {dataKeys.map(dataKey => {
            return (
              <Line
                key={dataKey.key.toString()}
                dataKey={dataKey.key.toString()}
                animationDuration={300}
                activeDot={dataKey.activeDot ? dataKey.activeDot : { stroke: background }}
                opacity={dataKey.opacity}
                type={type}
                strokeWidth={dataKey.strokeWidth ?? 2}
                stroke={dataKey.strokeColor}
                strokeDasharray={dataKey.strokeDasharray}
                dot={false}
              />
            )
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  )
}
