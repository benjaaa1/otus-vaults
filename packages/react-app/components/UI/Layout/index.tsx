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
    <div className="bg-zinc-900 font-sans">
      {network?.chainId == 10 || network?.chainId == 31337 ? null : < NetworkSwitch />}

      <Navbar />
      <main className="mx-auto max-w-6xl bg-zinc-900 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <FooterNav />
    </div>
  )
}
