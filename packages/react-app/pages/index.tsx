import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import Products from '../components/Products'
import Transactions from '../components/Portfolio/Transactions'
import MyVaultsTable from '../components/VaultManager/MyVaultsTable'
import Positions from '../components/Portfolio/Positions'
import Stats from '../components/Portfolio/Stats'

const Home: NextPage = () => {
  return (
    <div className="">
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="description" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grid sm:grid-cols-12 grid-cols-1 gap-8">
        <div className="sm:col-span-7 col-span-1">
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
        <div className="sm:col-span-5 col-span-1">
          <div className="grid grid-cols-1 sm:order-1">
            <div>
              <Positions />
            </div>
            <div className="order-first sm:order-2 shadow shadow-black">
              <Products />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
