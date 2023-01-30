import React, { ReactChild } from 'react'
import { useWeb3Context } from '../../../context'
import { Navbar } from '../Navbar'
import { FooterNav } from '../Navbar/footer'
import NetworkSwitch from '../NetworkSwitch'

interface Props {
  children: ReactChild
}

export default function Layout({ children }: Props) {
  const { network } = useWeb3Context()

  return (
    <div className="bg-zinc-900 font-sans flex flex-col h-screen">
      {
        network?.chainId == 10 || network?.chainId == 31337 || network?.chainId == 420 ?
          null :
          <NetworkSwitch />
      }

      <Navbar />
      <main className="bg-zinc-900 px-2 sm:px-4 md:px-6 lg:px-8">
        {children}
      </main>

      <FooterNav />

    </div>
  )
}
