import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/UI/Web3'
import Products from '../components/Products'
import Vault from '../components/Products/Vaults/Vault'
import { useVaultProducts } from '../queries/vaults/useVaultProducts'
import { Spinner } from '../components/UI/Components/Spinner'
// import Vaults from '../components/Products/Vaults/Vaults'

const Vaults: NextPage = () => {
  const { data, isLoading } = useVaultProducts()

  const vaults = data?.vaults || []
  console.log({ vaults })
  return (
    <div>
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="description" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mx-auto max-w-4xl py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {isLoading ? (
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
