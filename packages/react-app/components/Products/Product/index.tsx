import { useState, useCallback, useEffect } from 'react'
import {
  StrikeStrategy,
  useVaultProduct,
  VaultStrategy,
} from '../../../queries/vaults/useVaultProducts'
import { useRouter } from 'next/router'
import Transact from './Transact'
import { UserActionTabs } from '../../../constants/tabs'
import Deposit from './Deposit'
import { Button } from '../../UI/Components/Button'
import Withdraw from './Withdrawal'
import { useWeb3Context } from '../../../context'
import { getBlockExplorerUrl } from '../../../utils/getBlockExplorer'
import Modal from '../../UI/Modal'
import { formatUSD, fromBigNumber } from '../../../utils/formatters/numbers'
import { HOUR_SEC } from '../../../constants/period'
import { CheckIcon } from '@heroicons/react/24/solid'
import TradeTransactions from './TradeTransactions'
import { DynamicHedgeStrategy } from '../../../queries/myVaults/useMyVaults'

export default function Product() {
  const { network } = useWeb3Context()
  const router = useRouter()
  const { query } = router
  const { data: vault, isLoading } = useVaultProduct(query?.vault)

  const [tab, setTab] = useState<string>(UserActionTabs.DEPOSIT.HREF)
  const [openVaultStrategy, setOpenVaultStrategy] = useState(false)
  const [openStrikeStrategy, setOpenStrikeStrategy] = useState(false)
  const [openHedgeStrategy, setOpenHedgeStrategy] = useState(false)

  const [premiumCollected, setPremiumCollected] = useState(0);

  const calculatePremiumEarned = useCallback(() => {
    if (vault != null && vault.vaultTrades.length > 0) {
      const _premium = vault.vaultTrades.reduce((accum, trade) => {
        let { premiumEarned } = trade;
        let _premiumCollectedInTrade = fromBigNumber(premiumEarned);
        return accum + _premiumCollectedInTrade;;
      }, 0);
      setPremiumCollected(_premium);
    } else {
      setPremiumCollected(0);
    }
  }, [vault])

  useEffect(() => {
    try {
      calculatePremiumEarned()
    } catch (error) {
      console.log({ error })
    }
  }, [vault])

  return (
    <>
      <div className="h-full">
        <main className="py-8">
          <div className="mx-auto max-w-3xl text-white md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-3xl font-bold uppercase text-zinc-200">
                  {vault?.name || <span>---</span>}
                </h1>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-8 pt-8 pb-4">
            <div className="col-span-7 grid grid-cols-1 rounded-sm border border-zinc-700 bg-gradient-to-b from-black to-zinc-900 p-9">
              <div className="py-2">
                <div className="text-xxs font-bold uppercase text-zinc-300">
                  Strategy Description
                </div>
                <div className="py-4 text-xs font-normal text-zinc-300">
                  {vault?.description || '---'}
                </div>
              </div>
              <div className="py-2">
                <span className="round text-xxs font-bold uppercase text-zinc-300">
                  Current Strategies
                </span>
                <div className="grid grid-cols-3 py-4">
                  <div>
                    <Button
                      label="Vault Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenVaultStrategy(true)}
                    />
                  </div>
                  <div>
                    <Button
                      label="Strike Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenStrikeStrategy(true)}
                    />
                  </div>
                  <div>
                    {' '}
                    <Button
                      label="Hedge Strategy"
                      isLoading={false}
                      variant={'secondary'}
                      size={'xs'}
                      radius={'full'}
                      onClick={() => setOpenHedgeStrategy(true)}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 py-4">
                <div className="py-4 text-sm font-bold uppercase text-zinc-400">
                  Vault Snapshot
                </div>
                <div className="grid grid-cols-3">
                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Current Projected Apy
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      10.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Previous Week Performance
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      0.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Cumulative Yield
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      -12.2%
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Premium Collected
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      {formatUSD(premiumCollected)}
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Current Round
                    </div>
                    <div className="py-2 font-mono text-xl font-normal text-white">
                      {vault?.round}
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="text-xxs font-normal uppercase text-zinc-300">
                      Is Active
                    </div>
                    <div className="py-2 font-mono text-xl font-bold text-white">
                      {vault?.isActive ? <CheckIcon
                        className="h-5 w-5 text-emerald-600"
                        aria-hidden="true"
                      /> : 'No'}
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <div className="grid grid-cols-4">
                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Managed By
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">

                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Management Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        {vault?.managementFee}%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Performance Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        {vault?.performanceFee}%
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="text-xxs font-normal uppercase text-zinc-300">
                        Platform Fees
                      </div>
                      <div className="py-2 font-mono text-xl font-normal text-white">
                        0%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-5">
              <div className="rounded-sm border border-zinc-700 bg-zinc-800 shadow shadow-black">
                <Transact setTab={setTab} active={tab} />
                {tab == UserActionTabs.DEPOSIT.HREF ? (
                  <Deposit vault={vault} />
                ) : (
                  <Withdraw vault={vault} />
                )}
              </div>
              <div className="mt-4">
                <Button
                  label={`Contract Address: ${vault?.id.substring(0, 10)}...`}
                  variant={'primary'}
                  textVariant={'lowercase'}
                  size={'full-sm'}
                  radius={'full'}
                  textColor={'text-zinc-500'}
                  onClick={() => {
                    const url = getBlockExplorerUrl(network?.chainId || 10)
                    window.open(`${url}address/${vault?.id}`)
                  }}
                ></Button>
              </div>
            </div>
          </div>
        </main>

        <div className="grid grid-cols-12 gap-8">
          <div className='col-span-7'>
            <TradeTransactions vaultTrades={vault?.vaultTrades || []} />
          </div>
        </div>

      </div>
      <Modal
        title={'Vault Strategy'}
        setOpen={setOpenVaultStrategy}
        open={openVaultStrategy}
      >
        {vault?.strategy.vaultStrategy ? <VaultStrategyInfo strategy={vault?.strategy.vaultStrategy} /> : null}
      </Modal>
      <Modal
        title={'Strike Strategy'}
        setOpen={setOpenStrikeStrategy}
        open={openStrikeStrategy}
      >
        {vault?.strategy.strikeStrategies ? <StrikeStrategyInfo strikeStrategies={vault?.strategy.strikeStrategies} /> : null}
      </Modal>
      <Modal
        title={'Hedge Strategy'}
        setOpen={setOpenHedgeStrategy}
        open={openHedgeStrategy}
      >
        {vault?.strategy.dynamicHedgeStrategy ? <HedgeStrategyInfo hedgeType={vault?.strategy.hedgeType} strategy={vault?.strategy.dynamicHedgeStrategy} /> : null}
      </Modal>
    </>
  )
}

const VaultStrategyInfo = ({ strategy }: { strategy: VaultStrategy }) => {
  const { collatPercent, minTimeToExpiry, maxTimeToExpiry } = strategy
  return (
    <div className="grid grid-cols-3">
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Collateral Percent
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {`${fromBigNumber(collatPercent) * 100}%`}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Min. Time to Expiry (Hours)
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {minTimeToExpiry / HOUR_SEC}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Time to Expiry (Hours)
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {maxTimeToExpiry / HOUR_SEC}
          </div>
        </div>
      </div>
    </div>
  )
}

const StrikeStrategyInfo = ({ strikeStrategies }: { strikeStrategies: StrikeStrategy[] }) => {

  return (
    <div className="grid grid-cols-7">
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Option Type
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Target Delta
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Delta Gap
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Min Vol
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Vol
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Vol Variance
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">

          </div>
        </div>
      </div>

    </div>
  )
}

const HedgeStrategyInfo = ({ hedgeType, strategy }: { hedgeType: number, strategy: DynamicHedgeStrategy }) => {

  if (hedgeType == 1) {
    return <div>
      Hedging controlled by manager.
    </div>
  }
  const { threshold, maxLeverageSize, maxHedgeAttempts } = strategy;


  return (
    <div className="grid grid-cols-3">
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Delta Threshold
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(threshold)}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Leverage Size
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(maxLeverageSize)}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Hedge Attempts
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(maxHedgeAttempts)}
          </div>
        </div>
      </div>
    </div>
  )
}