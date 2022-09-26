import { useState } from 'react'
import { useWeb3Context } from '../../context'
import { useMyVaults } from '../../queries/myVaults/useMyVaults'
import { Spinner } from '../UI/Components/UI/Spinner'
import { MyBlockies } from '../UI/Web3/Address'
import EmptyState from './EmptyState'
import MyVaultsTable from './MyVaultsTable'
import Create from './Create'

export default function VaultManager() {
  const { address: managerId, network } = useWeb3Context()

  const { data, isLoading } = useMyVaults()
  console.log({ data, isLoading })
  const vaults = data?.vaults || []
  console.log({ vaults })
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="h-screen">
        <main className="py-10">
          {/* Page header */}
          <div className="mx-auto max-w-3xl md:flex md:items-center md:justify-between md:space-x-5 lg:max-w-6xl">
            <div className="flex items-center space-x-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {managerId != null ? (
                    <MyBlockies address={managerId} />
                  ) : null}
                </h1>
              </div>
            </div>
            <div className="justify-stretch mt-6 flex flex-col-reverse space-y-4 space-y-reverse sm:flex-row-reverse sm:justify-end sm:space-y-0 sm:space-x-3 sm:space-x-reverse md:mt-0 md:flex-row md:space-x-3">
              <button
                onClick={() => setOpen(true)}
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              >
                Create a New Vault
              </button>
            </div>
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <>
              {vaults.length ? (
                <MyVaultsTable vaults={vaults} />
              ) : (
                <EmptyState createNew={setOpen} />
              )}
            </>
          )}
        </main>
        <Create setOpen={setOpen} open={open} />
      </div>
    </>
  )
}
