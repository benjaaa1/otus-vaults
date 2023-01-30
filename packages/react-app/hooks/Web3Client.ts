import { useEffect, useReducer, useCallback } from 'react'
import { BigNumber, ethers, utils } from 'ethers'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { TransactionNotifier } from '@synthetixio/transaction-notifier'

import {
  Web3ProviderState,
  Web3Action,
  web3InitialState,
  web3Reducer,
} from '../reducers'

import { toast } from 'react-toastify'
import { SUPPORTED_NETWORKS } from '../constants/supportedChains'
import { ChainId, EthereumChainId } from '../constants/networks'

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
    network: 'localhost', // 'optimism-kovan', // optional
    cacheProvider: true,
    providerOptions, // required
  })
}

export const useWeb3 = () => {
  const [state, dispatch] = useReducer(web3Reducer, web3InitialState)
  const {
    signer,
    provider,
    web3Provider,
    address,
    ensName,
    ensAvatar,
    network,
    transactionNotifier,
  } = state

  const updateNetwork = async (_network: any) => {

    if (web3Modal && provider) {
      const formattedChainId = utils.hexStripZeros(
        BigNumber.from(_network.chainId).toHexString()
      );
      (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: formattedChainId }],
      });
    } else {
      // wallet not connected 
      // load network
      const networkProvider = SUPPORTED_NETWORKS[_network.chainId as ChainId];
      const provider = new ethers.providers.JsonRpcProvider(networkProvider, _network.chainId);
      const network = await provider.getNetwork()
      dispatch({
        type: 'SET_NETWORK',
        network: network
      })
    }
  };

  const connect = useCallback(async () => {
    if (web3Modal) {
      try {
        const provider = await web3Modal.connect()
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const signer = web3Provider.getSigner()
        const address = await signer.getAddress()


        const network = await web3Provider.getNetwork()
        const _transactionNotifier = transactionNotifier
          ? transactionNotifier.setProvider(web3Provider)
          : new TransactionNotifier(web3Provider)
        toast.success('Connected to Web3')

        dispatch({
          type: 'SET_WEB3_PROVIDER',
          signer,
          provider,
          web3Provider,
          address,
          network,
          transactionNotifier: _transactionNotifier,
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
      connect();
    }
  }, [connect])

  const connectEns = useCallback(async () => {
    if (address) {

      const mainnetProvider = new ethers.providers.JsonRpcProvider(SUPPORTED_NETWORKS[EthereumChainId.Mainnet], EthereumChainId.Mainnet);
      await mainnetProvider.detectNetwork()
      const _ensName = await mainnetProvider.lookupAddress(address);

      const resolver = _ensName ? await mainnetProvider.getResolver(_ensName) : null;
      const avatar = resolver ? await resolver.getAvatar() : null;

      if (_ensName) {
        dispatch({
          type: 'SET_ENS_ADDRESS',
          ensName: _ensName,
          ensAvatar: avatar?.url
        })
      }
    }
  }, [address])

  useEffect(() => {
    if (address) {
      // get ens avatar
      connectEns();
    }
  }, [address])

  // EIP-1193 events
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        toast.info('Changed Web3 Account')
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
        } as Web3Action)
      }

      // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
      const handleChainChanged = (_hexChainId: string) => {
        if (typeof window !== 'undefined') {
          toast.info('Web3 Network Changed')
          window.location.reload()
        } else {
          console.log('window is undefined')
        }
      }

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error)
        disconnect()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider, disconnect])

  return {
    ensName,
    ensAvatar,
    signer,
    provider,
    web3Provider,
    address,
    network,
    connect,
    disconnect,
    updateNetwork,
    transactionNotifier,
  } as Web3ProviderState
}
