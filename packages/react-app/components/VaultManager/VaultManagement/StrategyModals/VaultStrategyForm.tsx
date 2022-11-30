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
import { DAY_SEC, HOUR_SEC, WEEK_SEC } from '../../../../constants/period'
import { BYTES32_MARKET } from '../../../../constants/markets'
import { VaultStrategyStruct } from '../../Create'

const vaultStrategyInfoPlaceholder: VaultStrategyStruct = {
  hedgeReserve: toBN('.15'), // limit up to 50%
  collatBuffer: toBN('1.2'),
  collatPercent: toBN('.35'),
  minTimeToExpiry: DAY_SEC, // 24 hours
  maxTimeToExpiry: WEEK_SEC * 4,
  minTradeInterval: HOUR_SEC / 6,
  gwavPeriod: HOUR_SEC / 6,
  allowedMarkets: [
    BYTES32_MARKET.ETH,
  ],
}

const vaultStrategyInfoStep = {
  hedgeReserve: .05, // limit up to 50%
  collatBuffer: .1,
  collatPercent: .05,
  minTimeToExpiry: 1, // day
  maxTimeToExpiry: 28, // WEEK_SEC * 4,
  minTradeInterval: 10, // HOUR_SEC / 6,
  gwavPeriod: 10, // HOUR_SEC / 6,
}

const vaultStrategyInfoMin = {
  hedgeReserve: .1, // limit up to 50%
  collatBuffer: 0,
  collatPercent: .3,
  minTimeToExpiry: 1, // day
  maxTimeToExpiry: 28, // WEEK_SEC * 4,
  minTradeInterval: 1, // HOUR_SEC / 6,
  gwavPeriod: 1, // HOUR_SEC / 6,
}
const vaultStrategyInfoMax = {
  hedgeReserve: 1, // limit up to 50%
  collatBuffer: 1,
  collatPercent: 1,
  minTimeToExpiry: 7, // 7 days
  maxTimeToExpiry: 28, // WEEK_SEC * 4,
  minTradeInterval: 1, // HOUR_SEC / 6,
  gwavPeriod: 60, // HOUR_SEC / 6,
}

export default function VaultStrategyForm({ refetch, strategyId, vaultStrategy }: { refetch: any, strategyId: string | null, vaultStrategy: VaultStrategyStruct | null }) {

  const otusContracts = useOtusContracts()
  const monitorTransaction = useTransactionNotifier()
  const strategyContract = otusContracts && strategyId ? otusContracts[strategyId] : null

  const [vaultStrategyInfo, setVaultStrategyInfo] = useState<VaultStrategyStruct>(vaultStrategy || vaultStrategyInfoPlaceholder)
  const [isLoading, setIsLoading] = useState(false)
  console.log({ vaultStrategyInfo })
  const handleVaultStrategyUpdate = useCallback(async () => {
    if (strategyContract == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    setIsLoading(true)
    console.log({ strategyContract })
    const tx = await strategyContract.setStrategy(vaultStrategyInfo)

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

  }, [strategyContract, vaultStrategyInfo, isLoading, monitorTransaction])

  return (
    <div className="pt-8">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4">

        <div className="col-span-1">
          <div className="sm:col-span-6">
            <RangeSlider
              step={vaultStrategyInfoStep.collatBuffer}
              min={vaultStrategyInfoMin.collatBuffer}
              max={vaultStrategyInfoMax.collatBuffer}
              id={'collateral-buffer'}
              label={'Colalteral Buffer'}
              value={fromBigNumber(vaultStrategyInfo.collatBuffer)}
              onChange={(e) => {
                const collatBuffer = toBN(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.collatPercent}
              min={vaultStrategyInfoMin.collatPercent}
              max={vaultStrategyInfoMax.collatPercent}
              id={'collateral-percent'}
              label={'Collateral Percent'}
              value={fromBigNumber(vaultStrategyInfo.collatPercent)}
              onChange={(e) => {
                const collatPercent = toBN(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.hedgeReserve}
              min={vaultStrategyInfoMin.hedgeReserve}
              max={vaultStrategyInfoMax.hedgeReserve}
              id={'hedge-reserve'}
              label={'Funds reserved for Hedging'}
              value={fromBigNumber(vaultStrategyInfo.hedgeReserve)}
              onChange={(e) => {
                const hedgeReserve = toBN(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.minTimeToExpiry}
              min={vaultStrategyInfoMin.minTimeToExpiry}
              max={vaultStrategyInfoMax.minTimeToExpiry}
              id={'min-time-to-expiry'}
              label={'Min. Time to Expiry'}
              value={vaultStrategyInfo.minTimeToExpiry}
              onChange={(e) => {
                const minTimeToExpiry = parseInt(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.maxTimeToExpiry}
              min={vaultStrategyInfoMin.maxTimeToExpiry}
              max={vaultStrategyInfoMax.maxTimeToExpiry}
              id={'max-time-to-expiry'}
              label={'Max Time to Expiry'}
              value={vaultStrategyInfo.maxTimeToExpiry}
              onChange={(e) => {
                const maxTimeToExpiry = parseInt(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.minTradeInterval}
              min={vaultStrategyInfoMin.minTradeInterval}
              max={vaultStrategyInfoMax.minTradeInterval}
              id={'min-trade-interval'}
              label={'Min. Trade Interval'}
              value={vaultStrategyInfo.minTradeInterval}
              onChange={(e) => {
                const minTradeInterval = parseInt(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
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
              step={vaultStrategyInfoStep.gwavPeriod}
              min={vaultStrategyInfoMin.gwavPeriod}
              max={vaultStrategyInfoMax.gwavPeriod}
              id={'gwav-period'}
              label={'GWAV Period'}
              value={vaultStrategyInfo.gwavPeriod}
              onChange={(e) => {
                const gwavPeriod = parseInt(e.target.value)
                setVaultStrategyInfo((params: VaultStrategyStruct) => ({
                  ...params,
                  gwavPeriod,
                }))
              }}
              radius={'xs'}
              variant={'default'}
            />
          </div>
        </div>

        <div className="col-span-1">
          <>
            <Button
              label={'Update Hedge Strategy'}
              isLoading={false}
              variant={'primary'}
              radius={'xs'}
              size={'full-sm'}
              onClick={handleVaultStrategyUpdate}
            />
          </>
        </div>

      </div>
    </div>
  )
}
