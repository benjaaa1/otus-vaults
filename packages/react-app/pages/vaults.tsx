import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/UI/Web3'
import Products from '../components/Products'
// import Vaults from '../components/Products/Vaults/Vaults'

const Vaults: NextPage = () => {
  return (
    <div className="flex h-screen flex-col">
      <Head>
        <title>Otus Finance: Decentralized Options Vaults</title>
        <meta name="description" content="Decentralized Options Vaults" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="grid grid-cols-3 gap-7">
        {/** loop through available vaults */}
        <div className="border border-zinc-700 shadow-sm">vault 1</div>
        <div className="border border-zinc-700 shadow-sm">vault 2</div>
        <div className="border border-zinc-700 shadow-sm">vault 3</div>
      </div>

      {/* <Products />

      <div className="relative pt-12 pb-12">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-900 px-3 font-mono text-2xl font-medium text-white">
            Vaults
          </span>
        </div>
      </div> */}

      {/* <Vaults /> */}
    </div>
  )
}

export default Vaults
