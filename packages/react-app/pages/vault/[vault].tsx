import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import Product from '../../components/Products/Product'

const Vault: NextPage = () => {
  return (
    <div className="flex flex-col">
      <Head>
        <title>Decentralized Options Vault Detail</title>
        <meta
          name="description"
          content="Information: Decentralized Options Vault"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Product />
    </div>
  )
}

export default Vault
