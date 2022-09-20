import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import Product from '../../components/Products/Product'

const Vault: NextPage = () => {
  return (
    <div className="flex flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Product />
    </div>
  )
}

export default Vault
