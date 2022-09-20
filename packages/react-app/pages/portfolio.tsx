import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import UserPortfolio from '../components/Portfolio'

const Portfolio: NextPage = () => {
  return (
    <div className="flex h-screen flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <UserPortfolio />
    </div>
  )
}

export default Portfolio
