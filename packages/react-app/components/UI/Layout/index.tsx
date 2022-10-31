import React from 'react'
import { useWeb3Context } from '../../../context'
import { Navbar } from '../Navbar'
import { FooterNav } from '../Navbar/footer'
import NetworkSwitch from '../NetworkSwitch'

export default function Layout({ children }) {
  const { network } = useWeb3Context()
  console.log({ network })
  return (
    <div className="bg-zinc-900 font-sans">
      {network?.chainId != 10 ? <NetworkSwitch /> : null}

      <Navbar />
      <main className="mx-auto max-w-6xl bg-zinc-900 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <FooterNav />
    </div>
  )
}
