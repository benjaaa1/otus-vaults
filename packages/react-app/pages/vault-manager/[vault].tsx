import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import VaultManagement from '../../components/VaultManager/VaultManagement'

const Strategy: NextPage = () => {
  return (
    <div className="flex h-full flex-col">
      <Head>
        <title>Manage your Decentralized Options Vault</title>
        <meta
          name="description"
          content="Manage your Decentralized Options Vaul Settings"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VaultManagement />
    </div>
  )
}

export default Strategy
