import React, { createContext, useContext } from 'react'
import { useVaults } from '../hooks'
import {
  VaultsProviderState,
  vaultsInitialState,
} from '../reducers'

// ready
const VaultsContext = createContext<VaultsProviderState>(
  vaultsInitialState
)

// not ready
export const VaultsContextProvider = ({ children }: any) => {
  const vaultsProviderState = useVaults()

  return (
    <VaultsContext.Provider value={vaultsProviderState}>
      {children}
    </VaultsContext.Provider>
  )
}

// ready
export function useVaultsContext() {
  return useContext(VaultsContext)
}
