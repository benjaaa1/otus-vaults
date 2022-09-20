import { ethers } from 'ethers'

export type VaultManagerProviderState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: ethers.providers.JsonRpcSigner | null | undefined,
  provider: any
  web3Provider: ethers.providers.Web3Provider | null | undefined
  address: string | null | undefined
  network: ethers.providers.Network | null | undefined
  connect: (() => Promise<void>) | null
  disconnect: (() => Promise<void>) | null
}

/**************************************************/ 
/******************* STATE MANAGE *****************/ 
/**************************************************/ 

/******************** IF ACTIVE *******************/ 
// vaultinfo (active)
// expiry 
// strikes
// strategy info
// hedges
/************* IF PREVIOUSLY ACTIVE ****************/ 
// strikes traded (expiry, asset)

/***************** IF BRAND NEW ********************/ 
// vaultinfo (active)
// those active fields will start to populate 
// + have a trade value StrategyBase.StrikeTrade[] memory _strikes

// the lyra stuff wont be part of our state will just query for those and display only information we have in graph 
// if we need we'll query for it

/**************************************************/ 
/**************** NON STATE MANAGE ****************/ 
/**************************************************/ 
// get lyra market info
// get lyra boards
// get lyra board's strikes
// calculate pricing
// we should be able to do this through out 
// view current pricing info (24 hour % and price)

export const vaultManagerInitialState: VaultManagerProviderState = {
  signer: null,
  provider: null,
  web3Provider: null,
  address: null,
  network: null,
  connect: null,
  disconnect: null,
}

export type VaultManagerAction =
  | {
      type: 'SET_WEB3_PROVIDER'
      signer?: VaultManagerProviderState['signer']
      provider?: VaultManagerProviderState['provider']
      web3Provider?: VaultManagerProviderState['web3Provider']
      address?: VaultManagerProviderState['address']
      network?: VaultManagerProviderState['network']
    }
  | {
      type: 'SET_ADDRESS'
      address?: VaultManagerProviderState['address']
    }
  | {
      type: 'SET_NETWORK'
      network?: VaultManagerProviderState['network']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

export function vaultManagerReducer(
  state: VaultManagerProviderState,
  action: VaultManagerAction
): VaultManagerProviderState {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        signer: action.signer,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        network: action.network,
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
      return vaultManagerInitialState
    default:
      throw new Error()
  }
}