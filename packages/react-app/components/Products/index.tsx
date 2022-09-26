import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../../context'
import { useContracts } from '../../hooks/Web3Contracts'
import { ContractsMap } from '../../utils/types'
import { Button } from '../UI/Components/Button'
import CurrencyIconContainer from '../UI/Components/Currency/CurrencyIcon'
import BTCIcon from '../UI/Components/Icons/Color/BTC'
import ETHIcon from '../UI/Components/Icons/Color/ETH'
import LyraIcon from '../UI/Components/Icons/Color/LYRA'
import SNXLogoIcon from '../UI/Components/Icons/Color/SNX'
import Modal from '../UI/Modal'
import { Web3Address } from '../UI/Web3'
import Create from '../VaultManager/Create'

const Products = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="grid grid-cols-5 rounded-sm border border-zinc-700 bg-transparent p-9 ">
      <div>
        <div>
          <SNXLogoIcon />
        </div>
        <div>
          <LyraIcon />
        </div>

        <div>
          <ETHIcon />
        </div>
        <div>
          <BTCIcon />
        </div>
      </div>
      <div className="col-span-4 pl-2">
        <div className="text-3xl font-semibold text-white">
          Build and manage a decentralized options vault.
        </div>
        <div className="py-5 text-xs font-normal leading-5 text-white/50">
          We provide the tools to successfully and easily manage an options
          vault built on Lyra and Synthetix Futures.
        </div>
      </div>
      <div className="col-span-5">
        <Button
          label="Build a Vault"
          isLoading={false}
          variant={'primary'}
          radius={'xs'}
          onClick={setOpen}
          size={'full'}
        />
      </div>
      {/* <Create setOpen={setOpen} open={open} /> */}
    </div>
  )
}

export default Products
