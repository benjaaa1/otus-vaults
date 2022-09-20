import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import VaultManagement from '../../components/VaultManager/VaultManagement'

const Strategy: NextPage = () => {
  return (
    <div className="flex min-h-full flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VaultManagement />
    </div>
  )
}

export default Strategy
