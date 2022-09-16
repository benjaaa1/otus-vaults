import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Web3Button, Web3Address } from '../components/'

const Home: NextPage = () => {
  return (
    <div className="flex h-screen flex-col">
      <Head>
        <title>Web3 Next-Boilerplate</title>
        <meta name="description" content="Boilerplate for Web3 dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="flex flex-row justify-between p-4">
        <Link href="/my-vaults">
          <a className="text-lg font-light">My Vaults</a>
        </Link>

        <Link href="/my-vaults/vault/123">
          <a>Go to pages/my-vaults/[vault]/[strategy].js</a>
        </Link>

        <Link href="/forward-tests">
          <a>Go to pages/forward-tests</a>
        </Link>

        <Link href="/forward-tests/2134">
          <a>Go to pages/forward-tests/forward-test.js</a>
        </Link>

        <Web3Button />
      </nav>

      <main className="grow p-8 text-center">
        <h1 className="pb-8 text-4xl font-bold">Home Page</h1>
        <Web3Address />
      </main>

      <footer className="justify-end p-4">
        <p className="text-lg font-light">Footer</p>
      </footer>
    </div>
  )
}

export default Home
