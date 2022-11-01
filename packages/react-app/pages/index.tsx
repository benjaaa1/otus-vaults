import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/UI/Web3'
import Products from '../components/Products'
import Vaults from '../components/Products/Vaults/Vaults'
import Transactions from '../components/Portfolio/Transactions'
import MyVaultsTable from '../components/VaultManager/MyVaultsTable'
import Positions from '../components/Portfolio/Positions'
import Stats from '../components/Portfolio/Stats'

const Home: NextPage = () => {
  return (
    <div className="flex h-screen flex-col">
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="description" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7">
          <div className="grid grid-cols-1">
            <div>
              <Stats />
            </div>
            <div>
              <Transactions />
            </div>

            <div>
              <MyVaultsTable />
            </div>
          </div>
        </div>
        <div className="col-span-5 ">
          <div className="grid grid-cols-1">
            <div>
              <Positions />
            </div>
            <div className="shadow shadow-black">
              <Products />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
