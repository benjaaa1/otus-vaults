import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/Common/Web3'
import Products from '../components/Products'
import Vaults from '../components/Products/Vaults/Vaults'

const Home: NextPage = () => {
  return (
    <div className="flex min-h-full flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Products />

      <div className="relative pt-8 pb-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-dark-gray" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-black px-3 font-serif text-xl font-medium text-dark-gray">
            Vaults
          </span>
        </div>
      </div>

      <Vaults />
    </div>
  )
}

export default Home
