import React, { Dispatch, useCallback, useEffect, useState } from 'react'

import { Input } from '../../../UI/Components/Input/Input'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { Switch } from '../../../UI/Components/Switch'

import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { ZERO_BN } from '../../../../constants/bn'
import { Button } from '../../../UI/Components/Button'
import { BigNumber } from 'ethers'
import { DynamicHedgeStrategy, StrikeStrategy, useMyVaultStrikeStrategies } from '../../../../queries/myVaults/useMyVaults'
import { useOtusContracts } from '../../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../../hooks/TransactionNotifier'

const tabs = [
  { name: 'Buy Call', id: 0, href: 'buy-call' },
  { name: 'Buy Put', id: 1, href: 'buy-put' },
  { name: 'Sell Call', id: 3, href: 'sell-call' },
  { name: 'Sell Put', id: 4, href: 'sell-put' }
]

const strikeStrategyInfoPlaceholder: StrikeStrategy[] = [
  {
    targetDelta: toBN('0.2').mul(-1),
    maxDeltaGap: toBN('0.9'),
    minVol: toBN('0.3'),
    maxVol: toBN('1.9'),
    maxVolVariance: toBN('0.6'),
    optionType: 0
  },
  {
    targetDelta: toBN('0.2').mul(-1),
    maxDeltaGap: toBN('0.9'),
    minVol: toBN('0.3'),
    maxVol: toBN('1.9'),
    maxVolVariance: toBN('0.6'),
    optionType: 1
  },
  {
    targetDelta: toBN('0.2'),
    maxDeltaGap: toBN('0.9'),
    minVol: toBN('0.3'),
    maxVol: toBN('1.9'),
    maxVolVariance: toBN('0.6'),
    optionType: 3
  },
  {
    targetDelta: toBN('0.2').mul(-1),
    maxDeltaGap: toBN('0.9'),
    minVol: toBN('0.3'),
    maxVol: toBN('1.9'),
    maxVolVariance: toBN('0.6'),
    optionType: 4
  }
]

const vaultStrategyInfoStep = {
  targetDelta: .05,
  maxDeltaGap: .05,
  minVol: .05,
  maxVol: .05,
  maxVolVariance: .05
}

const vaultStrategyInfoMin = {
  targetDelta: .05,
  maxDeltaGap: .05,
  minVol: .05,
  maxVol: .05,
  maxVolVariance: .05
}
const vaultStrategyInfoMax = {
  targetDelta: 1,
  maxDeltaGap: 1,
  minVol: 1,
  maxVol: 1,
  maxVolVariance: 1
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const isValidOptionType = (optionType: number) => {
  if (optionType in [0, 1, 3, 4]) {
    return true;
  }
  return false;
}

export default function StrikeStrategyForm(
  { strategyId }:
    { strategyId: string }
) {

  const { data: strikeStrategies, refetch } = useMyVaultStrikeStrategies(strategyId);
  const otusContracts = useOtusContracts()
  const monitorTransaction = useTransactionNotifier();
  const strategyContract = otusContracts && strategyId ? otusContracts[strategyId] : null

  const [strikeStrategyInfo, setStrikeStrategyInfo] = useState<StrikeStrategy>();
  const [activeTab, setTab] = useState<number>(0)

  useEffect(() => {
    if (isValidOptionType(activeTab)) {
      if (strikeStrategies && strikeStrategies.length > 0) {
        let _strikeStrategy = strikeStrategies.filter(strikeStrategy => (activeTab === strikeStrategy.optionType));
        if (_strikeStrategy.length > 0) {
          setStrikeStrategyInfo(_strikeStrategy[0]);
        } else {
          let _strikeStrategy = strikeStrategyInfoPlaceholder.find(strikeStrategy => (activeTab === strikeStrategy.optionType));
          setStrikeStrategyInfo(_strikeStrategy);
        }
      } else {
        let _strikeStrategy = strikeStrategyInfoPlaceholder.find(strikeStrategy => (activeTab === strikeStrategy.optionType));
        setStrikeStrategyInfo(_strikeStrategy);
      }
    }
  }, [activeTab])

  const [isLoading, setIsLoading] = useState(false)

  const handleStrikeStrategyUpdate = useCallback(async () => {
    if (strategyContract == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    setIsLoading(true)
    console.log({ strategyContract })
    const tx = await strategyContract.setStrikeStrategyDetail()

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

  }, [strategyContract, isLoading, monitorTransaction])

  return (
    <div className="pt-8">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4">

        <div className="hidden sm:block">
          <div className="border-b border-zinc-700">
            <nav className="-mb-px flex" aria-label="Tabs">
              {tabs.map((_tab) => (
                <a
                  key={_tab.name}
                  onClick={() => setTab(_tab.id)}
                  className={classNames(
                    _tab.id == activeTab
                      ? ' text-emerald-600'
                      : ' text-zinc-500  hover:text-zinc-200',
                    'w-1/2 cursor-pointer border-b border-zinc-700 py-4 px-1 text-center text-xxs font-semibold uppercase border-t border-r first:border-l last:border-l-none'
                  )}
                  aria-current={_tab.id == activeTab ? 'page' : undefined}
                >
                  {_tab.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="col-span-1">
          {
            strikeStrategyInfo ?
              <StrikeStrategy optionType={activeTab} strategy={strikeStrategyInfo} setStrategy={setStrikeStrategyInfo} />
              :
              null
          }
        </div>

        <div className="col-span-1">
          <>
            <Button
              label={'Update Strike Strategies'}
              isLoading={false}
              variant={'primary'}
              radius={'xs'}
              size={'full-sm'}
              onClick={handleStrikeStrategyUpdate}
            />
          </>
        </div>

      </div>
    </div>
  )
}

const StrikeStrategy = (
  { optionType, strategy, setStrategy }:
    { optionType: number, strategy: StrikeStrategy, setStrategy: Dispatch<StrikeStrategy> }
) => {
  return <>
    <>{optionType}</>
    <div className="sm:col-span-6">
      <RangeSlider
        step={vaultStrategyInfoStep.targetDelta}
        min={vaultStrategyInfoMin.targetDelta}
        max={vaultStrategyInfoMax.targetDelta}
        id={'target-delta'}
        label={'Target Delta'}
        value={fromBigNumber(strategy.targetDelta)}
        onChange={(e) => {
          const targetDelta = toBN(e.target.value)
          setStrategy((params: StrikeStrategy) => ({
            ...params,
            targetDelta,
          }))
        }}
        radius={'xs'}
        variant={'default'}
      />
    </div>
    <div className="sm:col-span-6">
      <RangeSlider
        step={vaultStrategyInfoStep.maxDeltaGap}
        min={vaultStrategyInfoMin.maxDeltaGap}
        max={vaultStrategyInfoMax.maxDeltaGap}
        id={'max-delta-gap'}
        label={'Max Delta Gap'}
        value={fromBigNumber(strategy.maxDeltaGap)}
        onChange={(e) => {
          const maxDeltaGap = toBN(e.target.value)
          setStrategy((params: StrikeStrategy) => ({
            ...params,
            maxDeltaGap,
          }))
        }}
        radius={'xs'}
        variant={'default'}
      />
    </div>
    <div className="sm:col-span-6">
      <RangeSlider
        step={vaultStrategyInfoStep.minVol}
        min={vaultStrategyInfoMin.minVol}
        max={vaultStrategyInfoMax.minVol}
        id={'min-vol'}
        label={'Min Vol'}
        value={fromBigNumber(strategy.minVol)}
        onChange={(e) => {
          const minVol = toBN(e.target.value)
          setStrategy((params: StrikeStrategy) => ({
            ...params,
            minVol,
          }))
        }}
        radius={'xs'}
        variant={'default'}
      />
    </div>
    <div className="sm:col-span-6">
      <RangeSlider
        step={vaultStrategyInfoStep.maxVol}
        min={vaultStrategyInfoMin.maxVol}
        max={vaultStrategyInfoMax.maxVol}
        id={'max-vol'}
        label={'Max Vol'}
        value={fromBigNumber(strategy.maxVol)}
        onChange={(e) => {
          const maxVol = toBN(e.target.value)
          setStrategy((params: StrikeStrategy) => ({
            ...params,
            maxVol,
          }))
        }}
        radius={'xs'}
        variant={'default'}
      />
    </div>
    <div className="sm:col-span-6">
      <RangeSlider
        step={vaultStrategyInfoStep.maxVolVariance}
        min={vaultStrategyInfoMin.maxVolVariance}
        max={vaultStrategyInfoMax.maxVolVariance}
        id={'max-vol-variance'}
        label={'Max Vol Variance'}
        value={fromBigNumber(strategy.maxVolVariance)}
        onChange={(e) => {
          const maxVolVariance = toBN(e.target.value)
          setStrategy((params: StrikeStrategy) => ({
            ...params,
            maxVolVariance,
          }))
        }}
        radius={'xs'}
        variant={'default'}
      />
    </div>
  </>
}