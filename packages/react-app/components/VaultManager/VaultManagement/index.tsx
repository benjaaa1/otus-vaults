import { useState } from 'react'
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
                {tab === VaultManagerTabs.TRADE.HREF ? <Trade /> : <Current />}
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
