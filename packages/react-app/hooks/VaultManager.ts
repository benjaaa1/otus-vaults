import { useEffect, useReducer, useCallback } from 'react'
import { ethers } from 'ethers'

import {
  VaultManagerProviderState,
  VaultManagerAction,
  vaultManagerInitialState,
  vaultManagerReducer,
} from '../reducers'

import { toast } from 'react-toastify'

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    },
  },
}

let web3Modal: Web3Modal | null
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'optimism-kovan', // optional
    cacheProvider: true,
    providerOptions, // required
  })
}

export const useVaultManager = () => {
  const [state, dispatch] = useReducer(vaultManagerReducer, vaultManagerInitialState);
  const { signer, provider, web3Provider, address, network } = state
}

export const useWeb3 = () => {
  const [state, dispatch] = useReducer(web3Reducer, web3InitialState)
  const { signer, provider, web3Provider, address, network } = state

  const connect = useCallback(async () => {
    if (web3Modal) {
      try {
        const provider = await web3Modal.connect()
        const web3Provider = new ethers.providers.Web3Provider(provider)
        const signer = web3Provider.getSigner()
        const address = await signer.getAddress()
        const network = await web3Provider.getNetwork()
        toast.success('Connected to Web3')

        dispatch({
          type: 'SET_WEB3_PROVIDER',
          signer,
          provider,
          web3Provider,
          address,
          network
        } as Web3Action)
      } catch (e) {
        console.log('connect error', e)
      }
    } else {
      console.error('No Web3Modal')
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }
      toast.error('Disconnected from Web3')
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      } as Web3Action)
    } else {
      console.error('No Web3Modal')
    }
  }, [provider])

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connect()
    }
  }, [connect])

  return {
    signer,
    provider,
    web3Provider,
    address,
    network,
    connect,
    disconnect,
  } as VaultManagerProviderState
}