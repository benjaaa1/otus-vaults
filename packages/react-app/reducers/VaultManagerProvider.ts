export type VaultManagerProviderState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vaultInfo: any | null | undefined
  vaultParams: any | null | undefined
  currentStrikes: any | null | undefined
  currentHedges: any | null | undefined
  strategies: any | null | undefined
  builtTrades: any[] | null | undefined
  builtStrikeToHedge: any | null | undefined
  builtStrikeToClose: any | null | undefined
  toggleTrade: (trade: any) => void
  updateTradeSize: (trade: any) => void
  toggleToHedge: (hedge: any) => void
  toggleToClose: (close: any) => void
}

export const vaultManagerInitialState: VaultManagerProviderState = {
  vaultInfo: null,
  vaultParams: null,
  currentStrikes: [],
  currentHedges: [],
  strategies: null,
  builtTrades: [],
  builtStrikeToHedge: null,
  builtStrikeToClose: null,
  toggleTrade: (any) => void any,
  updateTradeSize: (any) => void any,
  toggleToHedge: (any) => void any,
  toggleToClose: (any) => void any,
}

export type VaultManagerAction =
  | {
      type: 'SET_VAULT_INFORMATION'
      vaultInfo?: VaultManagerProviderState['vaultInfo']
      vaultParams?: VaultManagerProviderState['vaultParams']
    }
  | {
      type: 'SET_CURRENT_ROUND_STRIKES'
      currentStrikes?: VaultManagerProviderState['currentStrikes']
    }
  | {
      type: 'SET_CURRENT_ROUND_HEDGES'
      currentHedges?: VaultManagerProviderState['currentHedges']
    }
  | {
      type: 'SET_STRATEGIES'
      strategies?: VaultManagerProviderState['strategies']
    }
  | {
      type: 'ADD_NEW_TRADE' | 'REMOVE_NEW_TRADE' | 'UPDATE_NEW_TRADE'
      builtTrades?: VaultManagerProviderState['builtTrades']
    }
  | {
      type: 'ADD_NEW_HEDGE' | 'REMOVE_NEW_HEDGE'
      builtStrikeToHedge?: VaultManagerProviderState['builtStrikeToHedge']
    }
  | {
      type: 'ADD_NEW_CLOSE' | 'REMOVE_NEW_CLOSE'
      builtStrikeToClose?: VaultManagerProviderState['builtStrikeToClose']
    }
  | {
      type: 'RESET_VAULT_MANAGER_PROVIDER'
    }

export function vaultManagerReducer(
  state: VaultManagerProviderState,
  action: VaultManagerAction
): VaultManagerProviderState {
  switch (action.type) {
    case 'SET_VAULT_INFORMATION':
      return {
        ...state,
        vaultInfo: action.vaultInfo,
        vaultParams: action.vaultParams,
      }
    case 'SET_CURRENT_ROUND_STRIKES':
      return {
        ...state,
        currentStrikes: action.currentStrikes,
      }
    case 'SET_CURRENT_ROUND_HEDGES':
      return {
        ...state,
        currentHedges: action.currentHedges,
      }
    case 'SET_STRATEGIES':
      return {
        ...state,
        strategies: action.strategies,
      }
    case 'ADD_NEW_TRADE':
      return {
        ...state,
        builtTrades: action.builtTrades,
      }
    case 'REMOVE_NEW_TRADE':
      return {
        ...state,
        builtTrades: action.builtTrades,
      }
    case 'UPDATE_NEW_TRADE':
      return {
        ...state,
        builtTrades: action.builtTrades,
      }
    case 'ADD_NEW_HEDGE':
      return {
        ...state,
        builtStrikeToHedge: action.builtStrikeToHedge,
      }
    case 'ADD_NEW_CLOSE':
      return {
        ...state,
        builtStrikeToClose: action.builtStrikeToClose,
      }
    case 'RESET_VAULT_MANAGER_PROVIDER':
      return vaultManagerInitialState
    default:
      throw new Error()
  }
}
