import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'
import { useMyVault } from '../../../queries/myVaults/useMyVaults'
import ManagerTabs from './UI/ManagerTabs'
import Trade from './Trade'
import Current from './Current'
import { VaultManagerTabs } from '../../../constants/tabs'
import { VaultManagerContextProvider } from '../../../context'
import TradeExecute from './Trade/TradeExecute'
import { Button } from '../../UI/Components/Button'
import HedgeExecute from './Current/HedgeExecute'
import { CheckIcon } from '@heroicons/react/20/solid'
import { useOtusVaultContracts } from '../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../hooks/TransactionNotifier'

export default function VaultManagement() {
  const { query } = useRouter()
  console.log({ vault: query?.vault })
  const { data, isLoading } = useMyVault(query?.vault)

  const [tab, setTab] = useState(VaultManagerTabs.CURRENT.HREF)

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
          </div>

          <div className="grid grid-cols-12 gap-8 py-8">
            <div className="col-span-8 grid grid-cols-1 rounded-sm border border-zinc-700 bg-gradient-to-b from-black to-zinc-900">
              <div className="rounded-sm  bg-transparent shadow shadow-black">
                <ManagerTabs setTab={setTab} active={tab} />
                {tab === VaultManagerTabs.TRADE.HREF ? (
                  <Trade />
                ) : (
                  <>
                    <CurrentRoundProgress vaultId={data?.id} />
                    <Current />
                  </>
                )}
              </div>
            </div>

            <div className="col-span-4">
              {tab === VaultManagerTabs.TRADE.HREF ? (
                <TradeExecute />
              ) : (
                <HedgeExecute />
              )}
            </div>
          </div>
        </main>
      </div>
    </VaultManagerContextProvider>
  )
}

const steps = [
  { id: '01', name: 'Start Round', href: '#', status: 'complete' }, // complete is "In progres"
  { id: '02', name: 'In Progress', href: '#', status: 'current' },
  { id: '03', name: 'Close Round', href: '#', status: 'upcoming' },
]

const CurrentRoundProgress = ({ vaultId }: { vaultId: string }) => {
  const otusContracts = useOtusVaultContracts()
  const otusVaultContract = otusContracts ? otusContracts[vaultId] : null
  const monitorTransaction = useTransactionNotifier()

  const handleStartRound = useCallback(async () => {
    if (otusVaultContract == null || vaultId == null) {
      console.warn('Vault does not exist to start')
      return null
    }

    const tx = await otusVaultContract.startNextRound()
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            // set vault state (in progress);
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract])

  const handleCloseRound = useCallback(async () => {
    if (otusVaultContract == null || vaultId == null) {
      console.warn('Vault does not exist to start')
      return null
    }

    const tx = await otusVaultContract.closeRound()
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            // set vault state (to ready to start round);
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract])

  return (
    <nav aria-label="Progress" className="p-4">
      <ol
        role="list"
        className="divide-y divide-zinc-800 rounded-md border border-zinc-800 md:flex md:divide-y-0"
      >
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex md:flex-1">
            {step.status === 'current' ? (
              <a href={step.href} className="group flex w-full items-center">
                <span className="flex items-center px-6 py-4 text-sm font-light">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 group-hover:bg-emerald-800">
                    <CheckIcon
                      className="h-3 w-3 text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="ml-4 text-sm font-light text-gray-900">
                    {step.name}
                  </span>
                </span>
              </a>
            ) : step.status === 'complete' ? (
              <a
                href={step.href}
                className="flex items-center px-6 py-4 text-sm font-medium"
                aria-current="step"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-emerald-600">
                  <span className="text-zinc-600">{step.id}</span>
                </span>
                <span className="ml-4 text-sm font-light text-zinc-500">
                  {step.name}
                </span>
              </a>
            ) : (
              <a href={step.href} className="group flex items-center">
                <span className="flex items-center px-6 py-4 text-sm font-medium">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                    <span className="text-zinc-200 group-hover:text-zinc-500">
                      {step.id}
                    </span>
                  </span>
                  <span className="ml-4 text-sm font-light text-zinc-200 group-hover:text-zinc-500">
                    {step.name}
                  </span>
                </span>
              </a>
            )}

            {stepIdx !== steps.length - 1 ? (
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
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
