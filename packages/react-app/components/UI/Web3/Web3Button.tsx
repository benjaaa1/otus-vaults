import React from 'react'
import { useWeb3Context } from '../../../context'
import { WalletIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../Components/Spinner'
import Avatar from 'react-avatar'
// @ts-ignore
import Blockies from 'react-blockies'

interface ConnectProps {
  connect: (() => Promise<void>)
}

const ConnectButton = ({ connect }: ConnectProps) => {
  return (
    <button
      className='text-sm text-white font-normal px-4 py-2 w-full rounded-md bg-zinc-800 hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
      onClick={() => connect()}
    >
      {
        !connect ?
          <Spinner /> :
          <div className='flex'>
            <div>
              <WalletIcon
                className="h-6 w-6 text-zinc-200"
                aria-hidden="true"
              />
            </div>
            <div className='px-2 items-center align-middle text-clip justify-center flex'>
              Wallet Connect
            </div>
          </div>
      }

    </button>
  )
}

interface DisconnectProps {
  disconnect: (() => Promise<void>)
  address: string | null | undefined
  ensName: string | null | undefined
  ensAvatar: string | null | undefined
}

const DisconnectButton = (
  { disconnect, address, ensName, ensAvatar }:
    DisconnectProps
) => {
  return (
    <button
      className='text-xs text-white font-normal px-4 py-2 w-full rounded-md bg-zinc-800 hover:bg-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2'
      onClick={() => disconnect()}
    >
      {
        !disconnect ?
          <Spinner /> :
          ensAvatar ?
            <div className='flex'>
              <div>
                <Avatar size="26" className='cursor-pointer' src={ensAvatar} round={true} />
              </div>
              <div className='px-2 items-center align-middle text-clip justify-center flex'>
                {ensName}
              </div>
            </div> :
            <div className='flex'>
              <div>
                <Blockies
                  size={6}
                  seed={address}
                  className={'rounded-full border border-zinc-700'}
                />
              </div>
              <div className='px-2 items-center align-middle text-clip justify-center flex text-sm'>
                {`${address?.substring(0, 10)}...`}
              </div>
            </div>
      }
    </button>
  )
}

export function Web3Button() {
  const { web3Provider, address, ensName, ensAvatar, connect, disconnect } = useWeb3Context()

  return web3Provider ? (
    disconnect
    && <DisconnectButton
      disconnect={disconnect}
      address={address}
      ensName={ensName}
      ensAvatar={ensAvatar}
    />
  ) : (
    connect && <ConnectButton connect={connect} />
  )
}
