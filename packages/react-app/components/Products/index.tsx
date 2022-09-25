import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../../context'
import { useContracts } from '../../hooks/Web3Contracts'
import { ContractsMap } from '../../utils/types'
import CurrencyIconContainer from '../UI/Components/Currency/CurrencyIcon'
import CryptoIcon from '../UI/Components/Icons'
import Modal from '../UI/Modal'
import { Web3Address } from '../UI/Web3'
import Create from '../VaultManager/Create'

const Products = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative overflow-auto rounded-xl pt-12 pb-8">
      <div className="mt-2 flex flex-wrap gap-12 rounded-lg font-mono text-sm font-bold leading-6 text-white">
        <div className="flex w-32 flex-1 items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-14 shadow">
          <span className="w-48 text-xl">
            Earn with managed vaults, choose by asset or by historical
            performance.
          </span>
          <CurrencyIconContainer currencyKey="sLINK" />
          <button
            type="button"
            className="text-md mr-2 mb-2 inline-flex items-center rounded-lg border border-emerald-600 bg-gradient-to-br from-emerald-600 to-blue-500 py-2 px-8 text-center font-sans font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            View Vaults
          </button>
        </div>
        <div className="flex w-32 flex-1 items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-14 shadow">
          <span className="w-48 text-xl">
            Build and Manage your own permissionless options vault for any
            asset.
          </span>
          <CryptoIcon />
          <button
            onClick={() => setOpen(true)}
            type="button"
            className="text-md mr-2 mb-2 inline-flex items-center rounded-lg border border-emerald-600 bg-gradient-to-br from-emerald-600 to-blue-500 py-2 px-8 text-center  font-sans font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            Create Vault
          </button>
        </div>
      </div>
      <Create setOpen={setOpen} open={open} />
    </div>
  )
}

export default Products
