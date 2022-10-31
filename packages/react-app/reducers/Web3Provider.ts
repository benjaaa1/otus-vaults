import { ethers } from 'ethers'
import { TransactionNotifierInterface } from '@synthetixio/transaction-notifier'

export type Web3ProviderState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: ethers.providers.JsonRpcSigner | any
  provider: any
  web3Provider: ethers.providers.Web3Provider | null | undefined
  address: string | null | undefined
  network: ethers.providers.Network | null | undefined
  connect: (() => Promise<void>) | null
  disconnect: (() => Promise<void>) | null
  transactionNotifier: TransactionNotifierInterface | null | undefined
}

export const web3InitialState: Web3ProviderState = {
  signer: null,
  provider: null,
  web3Provider: null,
  address: null,
  network: null,
  connect: null,
  disconnect: null,
  transactionNotifier: null,
}

export type Web3Action =
  | {
      type: 'SET_WEB3_PROVIDER'
      signer?: Web3ProviderState['signer']
      provider?: Web3ProviderState['provider']
      web3Provider?: Web3ProviderState['web3Provider']
      address?: Web3ProviderState['address']
      network?: Web3ProviderState['network']
      transactionNotifier?: Web3ProviderState['transactionNotifier']
    }
  | {
      type: 'SET_ADDRESS'
      address?: Web3ProviderState['address']
    }
  | {
      type: 'SET_NETWORK'
      network?: Web3ProviderState['network']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

export function web3Reducer(
  state: Web3ProviderState,
  action: Web3Action
): Web3ProviderState {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        signer: action.signer,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        network: action.network,
        transactionNotifier: action.transactionNotifier,
      }
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
      }
    case 'SET_NETWORK':
      return {
        ...state,
        network: action.network,
      }
    case 'RESET_WEB3_PROVIDER':
      return web3InitialState
    default:
      throw new Error()
  }
}
