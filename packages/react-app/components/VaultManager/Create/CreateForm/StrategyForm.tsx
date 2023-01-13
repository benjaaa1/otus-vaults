import React, { Fragment, Dispatch, useState } from 'react'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { fromBigNumber, toBN } from '../../../../utils/formatters/numbers'
import { DAY_SEC, HOUR_SEC, WEEK_SEC } from '../../../../constants/period'
import { VaultStrategyStruct } from '..'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { AVAILABLE_MARKETS_CHAIN } from '../../../../constants/markets'
import { useWeb3Context } from '../../../../context'
import { BytesLike } from 'ethers'

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const SelectAllowedMarkets = ({ vaultStrategy, setVaultStrategy }: { vaultStrategy: VaultStrategyStruct, setVaultStrategy: Dispatch<any> }) => {

  const { network } = useWeb3Context()
  const chainId: number | null = network != null ? network.chainId : null;

  if (!chainId) {
    console.warn("Wallet not connected");
  }

  const isSelected = (market: BytesLike[] | BytesLike) => {
    return vaultStrategy.allowedMarkets.find(allowed => allowed === market) ? true : false;
  }

  return <Listbox value={vaultStrategy.allowedMarkets} onChange={(value: any) => {
    let newAllowedMarkets: BytesLike[] = [];
    if (!isSelected(value)) {
      newAllowedMarkets = vaultStrategy.allowedMarkets.concat([value])
    } else {
      newAllowedMarkets = vaultStrategy.allowedMarkets.filter((el) => el !== value)
    }

    setVaultStrategy((params: VaultStrategyStruct) => ({
      ...params,
      allowedMarkets: newAllowedMarkets,
    }))
  }}>
    {({ open }) => (
      <>
        <Listbox.Label className="block text-xs leading-5 font-normal text-zinc-200">
          Select Markets Vault Trades
        </Listbox.Label>
        <div className="relative">
          <Listbox.Button className="rounded-xs relative w-full cursor-default border border-zinc-700 bg-zinc-800 py-2 pl-3 pr-10 text-left text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">
              {vaultStrategy.allowedMarkets.length > 0 ? `Selected Markets (${vaultStrategy.allowedMarkets.length})` : 'Select a Market'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="rounded-xs absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {
                chainId != null ?
                  AVAILABLE_MARKETS_CHAIN[chainId].map((market) => {
                    return <Listbox.Option
                      key={market.name}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-emerald-600 text-white' : 'text-white',
                          'relative cursor-default select-none py-2 pl-3 pr-9'
                        )
                      }
                      value={market.id}
                    >
                      {({ active }) => {
                        const selected = isSelected(market.id);
                        return <>
                          <div className="flex items-center">

                            <span
                              className={'font-normal ml-3 block truncate'}
                            >
                              {market.name}
                            </span>
                          </div>

                          {selected ? (
                            <span
                              className={classNames(
                                active ? 'text-white' : 'text-emerald-600',
                                'absolute inset-y-0 right-0 flex items-center pr-4'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      }}
                    </Listbox.Option>
                  }) :
                  null
              }
            </Listbox.Options>
          </Transition>
        </div>
      </>
    )}
  </Listbox>
}

export default function StrategyForm({ vaultStrategy, setVaultStrategy }: { vaultStrategy: VaultStrategyStruct, setVaultStrategy: Dispatch<any> }) {

  return (
    <div className="pt-6">
      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-6">
          <SelectAllowedMarkets vaultStrategy={vaultStrategy} setVaultStrategy={setVaultStrategy} />
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
              const collatBuffer = toBN(e.target.value)
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
              setVaultStrategy((params: VaultStrategyStruct) => ({
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
