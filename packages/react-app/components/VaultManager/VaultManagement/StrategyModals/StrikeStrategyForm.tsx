import React, { useCallback, useState } from 'react'

import { Input } from '../../../UI/Components/Input/Input'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { Switch } from '../../../UI/Components/Switch'

import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { ZERO_BN } from '../../../../constants/bn'
import { Button } from '../../../UI/Components/Button'
import { BigNumber } from 'ethers'
import { DynamicHedgeStrategy, useMyVaultStrikeStrategies } from '../../../../queries/myVaults/useMyVaults'
import { useOtusContracts } from '../../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../../hooks/TransactionNotifier'

const tabs = [
  { name: 'Buy Call', id: 0, href: 'buy-call' },
  { name: 'Buy Put', id: 1, href: 'buy-put' },
  { name: 'Sell Call', id: 3, href: 'sell-call' },
  { name: 'Sell Put', id: 4, href: 'sell-put' }
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function StrikeStrategyForm(
  { strategyId }:
    { strategyId: string }
) {

  const { data, refetch } = useMyVaultStrikeStrategies(strategyId);
  const otusContracts = useOtusContracts()
  const monitorTransaction = useTransactionNotifier();

  const strategyContract = otusContracts && strategyId ? otusContracts[strategyId] : null
  // const [dynamicHedgeInfo, setDynamicHedgeInfo] = useState<DynamicHedgeStrategy>(dynamicHedge || dynamicHedgeInfoPlaceholder)
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

  const [activeTab, setTab] = useState<string>('')

  return (
    <div className="pt-8">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4">

        <div className="hidden sm:block">
          <div className="border-b border-zinc-700">
            <nav className="-mb-px flex" aria-label="Tabs">
              {tabs.map((_tab) => (
                <a
                  key={_tab.name}
                  onClick={() => setTab(_tab.href)}
                  className={classNames(
                    _tab.href == activeTab
                      ? ' text-emerald-600'
                      : ' text-zinc-500  hover:text-zinc-200',
                    'w-1/2 cursor-pointer border-b border-zinc-700 py-4 px-1 text-center text-xxs font-semibold uppercase border-t border-r first:border-l last:border-l-none'
                  )}
                  aria-current={_tab.href == activeTab ? 'page' : undefined}
                >
                  {_tab.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="col-span-1">
          {activeTab}
        </div>

      </div>
    </div>
  )
}
