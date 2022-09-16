import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/'

const MyVaults: NextPage = () => {
  return (
    <div className="flex h-screen flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="grow p-8 text-center">MyVaults</main>

      <footer className="justify-end p-4">
        <p className="text-lg font-light">Footer</p>
      </footer>
    </div>
  )
}

export default MyVaults
