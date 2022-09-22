export type VaultManagerProviderState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vaultInfo: any | null | undefined
  vaultParams: any | null | undefined
  currentStrikes: any | null | undefined
  currentHedges: any | null | undefined
  strategies: any | null | undefined
  builtTrades: any[] | null | undefined
  builtHedges: any[] | null | undefined
  toggleTrade: (trade: any) => void
  updateTradeSize: (trade: any) => void
  addToHedges: (hedge: any) => void
  removeFromHedges: (hedge: any) => void
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
  vaultInfo: null,
  vaultParams: null,
  currentStrikes: [],
  currentHedges: [],
  strategies: null,
  builtTrades: [],
  builtHedges: [],
  toggleTrade: (any) => void any,
  updateTradeSize: (any) => void any,
  addToHedges: (any) => void any,
  removeFromHedges: (any) => void any,
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
      builtHedges?: VaultManagerProviderState['builtHedges']
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
        builtHedges: action.builtHedges,
      }
    case 'REMOVE_NEW_HEDGE':
      return {
        ...state,
        builtHedges: action.builtHedges,
      }
    case 'RESET_VAULT_MANAGER_PROVIDER':
      return vaultManagerInitialState
    default:
      throw new Error()
  }
}
