import React, { ReactChild, createContext, useContext } from 'react'
import { useVaultManager } from '../hooks'
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
  const vaultManagerProviderState = useVaultManager()

  return (
    <VaultManagerContext.Provider value={vaultManagerProviderState}>
      {children}
    </VaultManagerContext.Provider>
  )
}

// ready
export function useVaultManagerContext() {
  return useContext(VaultManagerContext)
}
