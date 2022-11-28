import React, { Dispatch } from 'react'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { DAY_SEC, HOUR_SEC, WEEK_SEC } from '../../../../constants/period'
import { StrategyDetailStruct } from '..'

const vaultStrategyStep = {
  collatBuffer: 0.05,
  collatPercent: 0.05,
  hedgeReserve: 0.05,
  minTimeToExpiry: HOUR_SEC,
  maxTimeToExpiry: HOUR_SEC,
  minTradeInterval: 10,
  gwavPeriod: 10,
}
const vaultStrategyMin = {
  collatBuffer: 0.75,
  collatPercent: 0.25,
  hedgeReserve: 0,
  minTimeToExpiry: 0,
  maxTimeToExpiry: WEEK_SEC,
  minTradeInterval: 0,
  gwavPeriod: 0,
}
const vaultStrategyMax = {
  collatBuffer: 2,
  collatPercent: 1,
  hedgeReserve: 0.5,
  minTimeToExpiry: WEEK_SEC,
  maxTimeToExpiry: WEEK_SEC * 8,
  minTradeInterval: DAY_SEC,
  gwavPeriod: HOUR_SEC,
}

export default function StrategyForm({ vaultStrategy, setVaultStrategy }: { vaultStrategy: StrategyDetailStruct, setVaultStrategy: Dispatch<any> }) {

  return (
    <div className="pt-8">
      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.collatBuffer}
            min={vaultStrategyMin.collatBuffer}
            max={vaultStrategyMax.collatBuffer}
            id={'collateral-buffer'}
            label={'Colalteral Buffer'}
            value={fromBigNumber(vaultStrategy.collatBuffer)}
            onChange={(e) => {
              const collatBuffer = toBN(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                collatBuffer,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.collatPercent}
            min={vaultStrategyMin.collatPercent}
            max={vaultStrategyMax.collatPercent}
            id={'collateral-percent'}
            label={'Collateral Percent'}
            value={fromBigNumber(vaultStrategy.collatPercent)}
            onChange={(e) => {
              const collatPercent = toBN(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                collatPercent,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.hedgeReserve}
            min={vaultStrategyMin.hedgeReserve}
            max={vaultStrategyMax.hedgeReserve}
            id={'hedge-reserve'}
            label={'Funds reserved for Hedging'}
            value={fromBigNumber(vaultStrategy.hedgeReserve)}
            onChange={(e) => {
              const hedgeReserve = toBN(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                hedgeReserve,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.minTimeToExpiry}
            min={vaultStrategyMin.minTimeToExpiry}
            max={vaultStrategyMax.minTimeToExpiry}
            id={'min-time-to-expiry'}
            label={'Min. Time to Expiry'}
            value={vaultStrategy.minTimeToExpiry}
            onChange={(e) => {
              const minTimeToExpiry = parseInt(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                minTimeToExpiry,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.maxTimeToExpiry}
            min={vaultStrategyMin.maxTimeToExpiry}
            max={vaultStrategyMax.maxTimeToExpiry}
            id={'max-time-to-expiry'}
            label={'Max Time to Expiry'}
            value={vaultStrategy.maxTimeToExpiry}
            onChange={(e) => {
              const maxTimeToExpiry = parseInt(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                maxTimeToExpiry,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.minTradeInterval}
            min={vaultStrategyMin.minTradeInterval}
            max={vaultStrategyMax.minTradeInterval}
            id={'min-trade-interval'}
            label={'Min. Trade Interval'}
            value={vaultStrategy.minTradeInterval}
            onChange={(e) => {
              const minTradeInterval = parseInt(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                minTradeInterval,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>

        <div className="sm:col-span-6">
          <RangeSlider
            step={vaultStrategyStep.gwavPeriod}
            min={vaultStrategyMin.gwavPeriod}
            max={vaultStrategyMax.gwavPeriod}
            id={'gwav-period'}
            label={'GWAV Period'}
            value={vaultStrategy.gwavPeriod}
            onChange={(e) => {
              const gwavPeriod = parseInt(e.target.value)
              setVaultStrategy((params: StrategyDetailStruct) => ({
                ...params,
                gwavPeriod,
              }))
            }}
            radius={'xs'}
            variant={'default'}
          />
        </div>
      </div>
    </div>
  )
}
