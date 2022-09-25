import React from 'react'
import { useWeb3Context } from '../../../context'

interface ConnectProps {
  connect: (() => Promise<void>) | null
}
const ConnectButton = ({ connect }: ConnectProps) => {
  return connect ? (
    <button
      className="inline-flex items-center rounded-full border border-transparent bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      onClick={connect}
    >
      Connect
    </button>
  ) : (
    <button>Loading...</button>
  )
}

interface DisconnectProps {
  disconnect: (() => Promise<void>) | null
}

const DisconnectButton = ({ disconnect }: DisconnectProps) => {
  return disconnect ? (
    <button
      className="inline-flex items-center rounded-full border border-transparent bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      onClick={disconnect}
    >
      Disconnect
    </button>
  ) : (
    <button className="inline-flex items-center rounded-full border border-transparent bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
      Loading...
    </button>
  )
}

export function Web3Button() {
  const { web3Provider, connect, disconnect } = useWeb3Context()

  return web3Provider ? (
    <DisconnectButton disconnect={disconnect} />
  ) : (
    <ConnectButton connect={connect} />
  )
}
