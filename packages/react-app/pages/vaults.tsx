import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Web3Button, Web3Address } from '../components/UI/Web3'
import Products from '../components/Products'
import Vault from '../components/Products/Vaults/Vault'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Spinner } from '../components/UI/Components/Spinner'
import { SelectFilterMarket } from '../components/Products/Vaults/Filters/market'
import { SelectFilterOptionType } from '../components/Products/Vaults/Filters/optionType'
import { SelectFilterNetwork } from '../components/Products/Vaults/Filters/network'

type VaultFilters = {
  market: string
  optionTypes: number[]
  network: string
}

const Vaults: NextPage = () => {
  const vaultProducts = useVaultProducts() // need to refresh this when filters are updated pass in filters too
  const vaults = vaultProducts?.data?.vaults || [];

  const [filters, setFilters] = useState<VaultFilters>({ market: '', optionTypes: [], network: '' })

  useEffect(() => {
    if (filters.market != '' || filters.optionTypes.length > 0 || filters.network != '') {
      // 
    }
  }, [filters]);

  const handleSelectedMarket = (value: string) => {
    setFilters((params: VaultFilters) => ({
      ...params,
      market: value
    }))
  }
  const handleSelectedOptionTypes = (value: number[]) => {
    // setFilters((params: VaultFilters) => ({
    //   ...params,
    //   market: value
    // }))
  }
  const handleSelectedNetworks = (value: string) => {
    setFilters((params: VaultFilters) => ({
      ...params,
      network: value
    }))
  }

  return (
    <div>
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="descript ion" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mx-auto max-w-4xl py-6">
        <div className="mx-auto max-w-2xl py-14">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="p-1 ">
              <SelectFilterMarket selectedMarket={filters.market} setSelectedMarket={handleSelectedMarket} />
            </div>
            <div className="p-1">
              <SelectFilterOptionType selectedOptionTypes={filters.optionTypes} setSelectedOptionTypes={handleSelectedOptionTypes} />
            </div>
            <div className="p-1">
              <SelectFilterNetwork selectedNetwork={filters.network} setSelectedNetwork={handleSelectedNetworks} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {vaultProducts?.isLoading ? (
            <div className="col-span-3 mx-auto">
              <Spinner />
            </div>
          ) : (
            vaults.map((vault) => <Vault key={vault.id} vault={vault} />)
          )}
        </div>
      </div>
    </div>
  )
}

export default Vaults
