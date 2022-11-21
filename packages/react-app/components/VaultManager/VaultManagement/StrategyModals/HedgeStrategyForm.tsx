import React, { useState } from 'react'

import { Input } from '../../../UI/Components/Input/Input'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { Switch } from '../../../UI/Components/Switch'

import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { ZERO_BN } from '../../../../constants/bn'
import { Button } from '../../../UI/Components/Button'

const types = [
  {
    label: 'No Hedge',
    value: 0
  },
  {
    label: 'User Hedge',
    value: 1
  },
  {
    label: 'Dynamic Hedge',
    value: 2
  }
]

export default function HedgeStrategyForm({ hedgeType }: { hedgeType: number }) {

  const [_hedgeType, _setHedgeType] = useState(hedgeType)
  const [maxLeverageSize, setMaxLeverageSize] = useState(ZERO_BN)
  const [maxHedgeAttempts, setMaxHedgeAttempts] = useState(ZERO_BN)
  const [threshold, setThreshold] = useState(ZERO_BN)

  const handleHedgeChange = (event) => {
    let value = event.target.value;
    _setHedgeType(value)
  }

  return (
    <div className="pt-8">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">

        <div className="sm:col-span-6">
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
          _hedgeType == 2 ?
            <>
              test
              {/* <div className="sm:col-span-6">
                <RangeSlider
                  step={vaultStrategyStep.collatBuffer}
                  min={vaultStrategyMin.collatBuffer}
                  max={vaultStrategyMax.collatBuffer}
                  id={'collateral-buffer'}
                  label={'Colalteral Buffer'}
                  value={fromBigNumber(vaultStrategy.collatBuffer)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const collatBuffer = toBN(e.target.value)
                    setVaultStrategy((params) => ({
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
                  step={vaultStrategyStep.collatBuffer}
                  min={vaultStrategyMin.collatBuffer}
                  max={vaultStrategyMax.collatBuffer}
                  id={'collateral-buffer'}
                  label={'Colalteral Buffer'}
                  value={fromBigNumber(vaultStrategy.collatBuffer)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const collatBuffer = toBN(e.target.value)
                    setVaultStrategy((params) => ({
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
                  step={vaultStrategyStep.collatBuffer}
                  min={vaultStrategyMin.collatBuffer}
                  max={vaultStrategyMax.collatBuffer}
                  id={'collateral-buffer'}
                  label={'Colalteral Buffer'}
                  value={fromBigNumber(vaultStrategy.collatBuffer)}
                  onChange={(e) => {
                    console.log(e.target.value)
                    const collatBuffer = toBN(e.target.value)
                    setVaultStrategy((params) => ({
                      ...params,
                      collatBuffer,
                    }))
                  }}
                  radius={'xs'}
                  variant={'default'}
                />
              </div> */}
            </> :
            null
        }

        <div className="justify-end px-4 py-4">
          <>
            <Button
              label={'Next'}
              isLoading={false}
              variant={'primary'}
              radius={'xs'}
              size={'md'}
              onClick={() => console.log(2)}
            />
          </>
        </div>

      </div>
    </div>
  )
}
