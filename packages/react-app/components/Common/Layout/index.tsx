import React from 'react'
import { useWeb3Context } from '../../../context'
import { Navbar } from '../Navbar'
import NetworkSwitch from '../NetworkSwitch'

export default function Layout({ children }) {
  const { network } = useWeb3Context()
  console.log({ network })
  return (
    <div className="bg-black">
      {network?.chainId != 69 ? <NetworkSwitch /> : null}

      <Navbar />
      <main className="mx-auto max-w-7xl bg-black px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="mx-auto max-w-7xl justify-end p-4 px-4 sm:px-6 lg:px-8">
        <p className="text-lg font-light">Footer</p>
      </footer>
    </div>
  )
}
