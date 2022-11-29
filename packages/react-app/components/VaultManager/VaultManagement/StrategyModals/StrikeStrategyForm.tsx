import React, { useCallback, useState } from 'react'

import { Input } from '../../../UI/Components/Input/Input'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { Switch } from '../../../UI/Components/Switch'

import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { ZERO_BN } from '../../../../constants/bn'
import { Button } from '../../../UI/Components/Button'
import { BigNumber } from 'ethers'
import { DynamicHedgeStrategy } from '../../../../queries/myVaults/useMyVaults'
import { useOtusContracts } from '../../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../../hooks/TransactionNotifier'

const tabs = [
  { name: 'Buy Call', id: 0 },
  { name: 'Buy Put', id: 1 },
  { name: 'Sell Call', id: 3 },
  { name: 'Sell Put', id: 4 }
]

const dynamicHedgeInfoPlaceholder: DynamicHedgeStrategy = {
  maxLeverageSize: toBN(String(1)),
  maxHedgeAttempts: toBN(String(1)),
  threshold: toBN(String(1)),
}

const dynamicHedgeInfoStep = {
  maxLeverageSize: .1,
  maxHedgeAttempts: 1,
  threshold: .05
}

const dynamicHedgeInfoMin = {
  maxLeverageSize: 1,
  maxHedgeAttempts: 1,
  threshold: 0
}
const dynamicHedgeInfoMax = {
  maxLeverageSize: 3,
  maxHedgeAttempts: 10,
  threshold: 1
}

export default function HedgeStrategyForm({ refetch, strategyId, hedgeType, dynamicHedge }: { refetch: any, strategyId: string | null, hedgeType: number, dynamicHedge?: DynamicHedgeStrategy }) {

  const otusContracts = useOtusContracts()
  const monitorTransaction = useTransactionNotifier()
  const strategyContract = otusContracts && strategyId ? otusContracts[strategyId] : null

  const [_hedgeType, _setHedgeType] = useState(hedgeType)
  const [dynamicHedgeInfo, setDynamicHedgeInfo] = useState<DynamicHedgeStrategy>(dynamicHedge || dynamicHedgeInfoPlaceholder)
  const [isLoading, setIsLoading] = useState(false)

  const handleHedgeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let value = event.target.value;
    _setHedgeType(parseInt(value))
  }

  const handleStrategyUpdate = useCallback(async () => {
    if (strategyContract == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    setIsLoading(true)
    console.log({ strategyContract })
    const tx = await strategyContract.setHedgeStrategyType(_hedgeType)

    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(async () => {
            setIsLoading(false);
            await refetch();
          }, 5 * 1000)
        },
      })
    }

    if (_hedgeType == 2) { // dynamic type
      const tx2 = await strategyContract.setHedgeStrategies(dynamicHedgeInfo)
      if (tx2) {
        monitorTransaction({
          txHash: tx2.hash,
          onTxConfirmed: () => {
            setTimeout(async () => {
              setIsLoading(false);
              await refetch();
            }, 5 * 1000)
          },
        })
      }
    }

  }, [strategyContract, _hedgeType, dynamicHedgeInfo, isLoading, monitorTransaction])

  return (
    <div className="pt-8">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4">

        <div className="col-span-1">
          <label htmlFor={'hedgeType'} className={'text-xs text-zinc-200 font-normal pb-2'}>
            Hedge Type
          </label>
          <select
            id="hedgeType"
            name="hedgeType"
            className="block w-full text-xs border-zinc-700 bg-zinc-900 text-white rounded-sm focus:border-indigo-500 focus:ring-indigo-500"
            defaultValue={hedgeType}
            onChange={handleHedgeChange}
          >
            {types.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {
          _hedgeType == 2 && dynamicHedge != null ?
            <div className="col-span-1">
              <div className="sm:col-span-6">
                <RangeSlider
                  step={dynamicHedgeInfoStep.maxLeverageSize}
                  min={dynamicHedgeInfoMin.maxLeverageSize}
                  max={dynamicHedgeInfoMax.maxLeverageSize}
                  id={'maxLeverageSize'}
                  label={'Max Leverage Size'}
                  value={fromBigNumber(dynamicHedgeInfo.maxLeverageSize)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const maxLeverageSize = toBN(e.target.value)
                    setDynamicHedgeInfo((params) => ({
                      ...params,
                      maxLeverageSize,
                    }))
                  }}
                  radius={'xs'}
                  variant={'default'}
                />
              </div>

              <div className="sm:col-span-6">
                <RangeSlider
                  step={dynamicHedgeInfoStep.maxHedgeAttempts}
                  min={dynamicHedgeInfoMin.maxHedgeAttempts}
                  max={dynamicHedgeInfoMax.maxHedgeAttempts}
                  id={'maxHedgeAttempts'}
                  label={'Max Hedge Attempts'}
                  value={fromBigNumber(dynamicHedgeInfo.maxHedgeAttempts)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const maxHedgeAttempts = toBN(e.target.value)
                    setDynamicHedgeInfo((params) => ({
                      ...params,
                      maxHedgeAttempts,
                    }))
                  }}
                  radius={'xs'}
                  variant={'default'}
                />
              </div>


              <div className="sm:col-span-6">
                <RangeSlider
                  step={dynamicHedgeInfoStep.threshold}
                  min={dynamicHedgeInfoMin.threshold}
                  max={dynamicHedgeInfoMax.threshold}
                  id={'threshold'}
                  label={'Threshold'}
                  value={fromBigNumber(dynamicHedgeInfo.threshold)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const threshold = toBN(e.target.value)
                    setDynamicHedgeInfo((params) => ({
                      ...params,
                      threshold,
                    }))
                  }}
                  radius={'xs'}
                  variant={'default'}
                />
              </div>
            </div> :
            null
        }

        <div className="col-span-1">
          <>
            <Button
              label={'Update Hedge Strategy'}
              isLoading={false}
              variant={'primary'}
              radius={'xs'}
              size={'full-sm'}
              onClick={handleStrategyUpdate}
            />
          </>
        </div>

      </div>
    </div>
  )
}
