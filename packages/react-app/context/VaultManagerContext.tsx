import React, { ReactChild, createContext, useContext } from 'react'
import { useWeb3 } from '../hooks/Web3Client'
import {
  VaultManagerProviderState,
  vaultManagerInitialState,
} from '../reducers'

// ready
const VaultManagerContext = createContext<VaultManagerProviderState>(
  vaultManagerInitialState
)

interface Props {
  children: ReactChild
}

// not ready
export const VaultManagerContextProvider = ({ children }: Props) => {
  const web3ProviderState = useWeb3()

  return (
    <VaultManagerContext.Provider value={web3ProviderState}>
      {children}
    </VaultManagerContext.Provider>
  )
}

// ready
export function useVaultManagerContext() {
  return useContext(VaultManagerContext)
}
