import React from 'react'
import { useWeb3Context } from '../../../context'
import { Button } from '../Components/Button'

interface ConnectProps {
  connect: (() => Promise<void>) | null
}
const ConnectButton = ({ connect }: ConnectProps) => {
  return (
    <Button
      label={'Wallet Connect'}
      variant="primary"
      isLoading={!connect}
      radius="xs"
      size="sm"
      onClick={connect}
    />
  )
}

interface DisconnectProps {
  disconnect: (() => Promise<void>) | null
}

const DisconnectButton = ({ disconnect }: DisconnectProps) => {
  return (
    <Button
      label={'Wallet Disconnect'}
      variant="primary"
      isLoading={!disconnect}
      radius="xs"
      size="sm"
      onClick={disconnect}
    />
  )
}

export function Web3Network() {
  const { web3Provider, address, ensAvatar, connect, disconnect } = useWeb3Context()

  return web3Provider ? (
    <DisconnectButton disconnect={disconnect} />
  ) : (
    <ConnectButton connect={connect} />
  )
}
