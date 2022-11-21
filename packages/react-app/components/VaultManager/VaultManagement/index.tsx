import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import { useMyVault, Vault } from '../../../queries/myVaults/useMyVaults'
import ManagerTabs from './UI/ManagerTabs'
import Trade from './Trade'
import Current from './Current'
import { VaultManagerTabs } from '../../../constants/tabs'
import { VaultManagerContextProvider } from '../../../context'
import TradeExecute from './Trade/TradeExecute'
import { Button } from '../../UI/Components/Button'
import {
  ArrowRightCircleIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'
import { useOtusVaultContracts } from '../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../hooks/TransactionNotifier'
import { formatUSD, fromBigNumber } from '../../../utils/formatters/numbers'
import { CurrentExecute } from './Current/Execute'
import Modal from '../../UI/Modal'
import HedgeStrategyForm from './StrategyModals/HedgeStrategyForm'

export default function VaultManagement() {
  const { query } = useRouter()

  const { data, isLoading, refetch } = useMyVault(query?.vault)

  const [tab, setTab] = useState(VaultManagerTabs.CURRENT.HREF)

  const [openVaultStrategy, setOpenVaultStrategy] = useState(false)
  const [openStrikeStrategy, setOpenStrikeStrategy] = useState(false)
  const [openHedgeStrategy, setOpenHedgeStrategy] = useState(false)

  return (
    <VaultManagerContextProvider>
      <div className="h-full">
        <main className="py-8">
          {/* Page header */}
          <div className="mx-auto max-w-3xl text-white md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-3xl font-bold uppercase text-zinc-200">
                  {data?.name || <span>---</span>}
                </h1>
              </div>
            </div>
            <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
              <Button
                label={'Vault Settings'}
                variant={'secondary'}
                size={'sm'}
                onClick={() => setOpenVaultStrategy(true)}
                radius={'full'}
              />
              <Button
                label={'Strike Settings'}
                variant={'secondary'}
                size={'sm'}
                onClick={() => setOpenStrikeStrategy(true)}
                radius={'full'}
              />
              <Button
                label={'Hedge Settings'}
                variant={'secondary'}
                size={'sm'}
                onClick={() => setOpenHedgeStrategy(true)}
                radius={'full'}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 py-8">
            <div className="col-span-8 grid grid-cols-1 rounded-sm border border-zinc-700 bg-gradient-to-b from-black to-zinc-900">
              <div className="rounded-sm  bg-transparent shadow shadow-black">
                <ManagerTabs setTab={setTab} active={tab} />
                {tab === VaultManagerTabs.TRADE.HREF ? (
                  <Trade />
                ) : (
                  <>
                    {data?.id != null ? (
                      <>
                        <CurrentRoundProgress vault={data} refetch={refetch} />
                        <CurrentDetails vault={data} />
                      </>
                    ) : null}
                    {data?.id != null && data?.vaultTrades.length > 0 ? (
                      <Current
                        hedgeType={data?.strategy.hedgeType}
                        activeVaultTrades={data?.vaultTrades}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="col-span-4">
              {data != null ? (
                tab === VaultManagerTabs.TRADE.HREF ? (
                  <TradeExecute vault={data} />
                ) : (
                  <CurrentExecute strategyId={data?.strategy.id} />
                )
              ) : null}
            </div>
          </div>
        </main>
      </div>
      <Modal
        title={'Vault Strategy'}
        setOpen={setOpenVaultStrategy}
        open={openVaultStrategy}
      >
        Vault
      </Modal>
      <Modal
        title={'Strike Strategy'}
        setOpen={setOpenStrikeStrategy}
        open={openStrikeStrategy}
      >
        Strike
      </Modal>
      <Modal
        title={'Hedge Strategy'}
        setOpen={setOpenHedgeStrategy}
        open={openHedgeStrategy}
      >
        <HedgeStrategyForm hedgeType={data?.strategy.hedgeType} />
      </Modal>
    </VaultManagerContextProvider>
  )
}

const CurrentRoundProgress = ({
  vault,
  refetch,
}: {
  vault: Vault
  refetch: any
}) => {
  const { id, inProgress } = vault
  const otusContracts = useOtusVaultContracts()
  const otusVaultContract = otusContracts ? otusContracts[id] : null
  const monitorTransaction = useTransactionNotifier()

  const [isStartRoundLoading, setStartRoundLoading] = useState(false)
  const [isEndRoundLoading, setEndRoundLoading] = useState(false)

  const startRoundStyle = inProgress
    ? 'text-zinc-500'
    : 'text-emerald-600 hover:text-emerald-900'
  const inProgressStyle = inProgress
    ? 'text-emerald-600 hover:text-emerald-900'
    : 'text-zinc-500'

  const startPointer = inProgress ? 'cursor-not-allowed' : 'cursor-pointer'
  const closePointer = inProgress ? 'cursor-pointer' : 'cursor-not-allowed'

  const handleStartRound = useCallback(async () => {
    if (otusVaultContract == null || id == null) {
      console.warn('Vault does not exist to start')
      return null
    }

    setStartRoundLoading(true)

    const tx = await otusVaultContract.startNextRound()
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            // set vault state (in progress);
            setStartRoundLoading(false)
            refetch()
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract])

  const handleCloseRound = useCallback(async () => {
    if (otusVaultContract == null || id == null) {
      console.warn('Vault does not exist to start')
      return null
    }

    setEndRoundLoading(true)
    const tx = await otusVaultContract.closeRound()
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            // set vault state (to ready to start round);
            setEndRoundLoading(false)

            refetch()
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract])

  return (
    <nav aria-label="Progress" className="p-4 py-6 pb-2">
      <ol
        role="list"
        className="divide-y divide-zinc-800 rounded-md border border-zinc-800 md:flex md:divide-y-0"
      >
        <li
          onClick={handleStartRound}
          key={1}
          className={`${startPointer} relative md:flex md:flex-1`}
        >
          <a
            className="flex items-center px-6 py-4 text-sm font-medium"
            aria-current="step"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
              <ArrowRightCircleIcon
                className={`h-4 w-4 ${startRoundStyle}`}
                aria-hidden="true"
              />
            </span>
            <span className={`ml-4 text-sm font-light ${startRoundStyle}`}>
              Start Round
            </span>
          </a>
          <>
            {/* Arrow separator for lg screens and up */}
            <div
              className="absolute top-0 right-0 hidden h-full w-5 md:block"
              aria-hidden="true"
            >
              <svg
                className="h-full w-full text-zinc-800"
                viewBox="0 0 22 80"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 -2L20 40L0 82"
                  vectorEffect="non-scaling-stroke"
                  stroke="currentcolor"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        </li>
        <li key={0} className={`relative md:flex md:flex-1`}>
          <a className="group flex w-full items-center">
            <span className="flex items-center px-6 py-4 text-sm font-light">
              <span
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full`}
              >
                {inProgress ? (
                  <CheckIcon
                    className="h-3 w-3 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircleIcon
                    className="h-3 w-3 text-zinc-200 bg-zinc-900"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className={`ml-4 text-sm font-light ${inProgressStyle}`}>
                In Progress
              </span>
            </span>
          </a>
          <>
            {/* Arrow separator for lg screens and up */}
            <div
              className="absolute top-0 right-0 hidden h-full w-5 md:block"
              aria-hidden="true"
            >
              <svg
                className="h-full w-full text-zinc-800"
                viewBox="0 0 22 80"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 -2L20 40L0 82"
                  vectorEffect="non-scaling-stroke"
                  stroke="currentcolor"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        </li>

        <li
          onClick={handleCloseRound}
          key={2}
          className={`${closePointer} relative md:flex md:flex-1`}
        >
          <a
            className="flex items-center px-6 py-4 text-sm font-medium"
            aria-current="step"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
              <ArrowRightCircleIcon
                className={`h-4 w-4 ${inProgressStyle}`}
                aria-hidden="true"
              />
            </span>
            <span className={`ml-4 text-sm font-light ${inProgressStyle}`}>
              Close Round
            </span>
          </a>
        </li>
      </ol>
    </nav>
  )
}

const CurrentDetails = ({ vault }: { vault: Vault }) => {
  const {
    round,
    isPublic,
    totalDeposit,
    vaultCap,
    strategy: { hedgeType },
  } = vault
  return (
    <div className="grid sm:grid-cols-5 gap-2 border-b border-zinc-700 px-6 py-3 items-center">
      <div>
        <div className="py-2">
          <div className="text-xxs font-normal text-zinc-300">Round</div>
          <div className="py-2 font-mono text-xl font-normal text-zinc-200">
            {round}
          </div>
        </div>
      </div>
      <div>
        <div className="py-2">
          <div className="text-xxs font-normal text-zinc-300">Public Vault</div>
          <div className="py-2 font-mono text-xl font-normal text-zinc-200">
            {isPublic ? 'True' : 'False'}
          </div>
        </div>
      </div>
      <div>
        <div className="py-2">
          <div className="text-xxs font-normal text-zinc-300">
            Total Deposits
          </div>
          <div className="py-2 font-mono text-xl font-normal text-zinc-200">
            {`${formatUSD(fromBigNumber(totalDeposit))}`}
          </div>
        </div>
      </div>
      <div>
        <div className="py-2">
          <div className="text-xxs font-normal text-zinc-300">Vault Cap</div>
          <div className="py-2 font-mono text-xl font-normal text-zinc-200">
            {`${formatUSD(fromBigNumber(vaultCap))}`}
          </div>
        </div>
      </div>
      <div>
        <div className="py-2">
          <div className="text-xxs font-normal text-zinc-300">Hedge Type</div>
          <div className="py-2 font-mono text-xl font-normal text-zinc-200">
            {getHedgeType(hedgeType)}
          </div>
        </div>
      </div>
    </div>
  )
}

const getHedgeType = (hedgeType: number) => {
  switch (hedgeType) {
    case 0:
      return 'None'
    case 1:
      return 'User'
    case 2:
      return 'Dynamic'
    default:
      break
  }
}
