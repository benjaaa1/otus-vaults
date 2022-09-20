import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../../context'
import { useContracts } from '../../hooks/Web3Contracts'
import { ContractsMap } from '../../utils/types'
import Modal from '../Common/Modal'
import { Web3Address } from '../Common/Web3'
import SlideInPanel from '../VaultManager/Settings/SlideInPanel'

const Products = () => {
  // const { signer, network } = useWeb3Context()

  // const { contracts } = useContracts(signer, network, {})

  // const [error, setError] = useState<string | null>(null)

  // useEffect(() => {
  //   const getActiveVaults = async () => {
  //     if (!signer || !network || !contracts) {
  //       return
  //     }
  //     try {
  //       setError(null)
  //       const OtusController = getOtusContract('OtusController', contracts) // contracts['OtusController'];

  //       const vaults = await OtusController.getActiveVaults()
  //       console.log({ vaults })
  //       // setVaults(vaults);
  //     } catch (e) {
  //       console.log(e)

  //       // @ts-ignore
  //       setError(e?.data?.message ?? e.message)
  //     }
  //   }

  //   getActiveVaults()
  // }, [signer, network, contracts])

  const [open, setOpen] = useState(false)

  return (
    <div className="relative overflow-auto rounded-xl pt-12 pb-8">
      <div className="bg-stripes-pink mt-2 flex flex-wrap gap-4 rounded-lg font-mono text-sm font-bold leading-6 text-white">
        <div className="flex w-32 flex-1 items-center justify-center rounded-lg bg-dark-gray p-4 shadow-lg">
          <span>
            Earn with managed vaults, choose by asset or by historical
            performance.
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-transparent bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-dark-gray focus:outline-none focus:ring-2 focus:ring-dark-gray focus:ring-offset-2"
          >
            View Vaults
          </button>
        </div>
        <div className="flex w-32 flex-1 items-center justify-center rounded-lg bg-dark-gray shadow-lg">
          <span>
            Build and Manage your own permissionless options vault for any
            asset.
          </span>
          <button
            onClick={() => setOpen(true)}
            type="button"
            className="inline-flex items-center rounded-full border border-transparent bg-black px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-dark-gray focus:outline-none focus:ring-2 focus:ring-dark-gray focus:ring-offset-2"
          >
            Create Vault
          </button>
        </div>
      </div>
      <SlideInPanel setOpen={setOpen} open={open}>
        tet
      </SlideInPanel>
    </div>
  )
}

export default Products
