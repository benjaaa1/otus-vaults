import { Strategy, StrategyDirection, StrategyType } from "../utils/types/builder"
import { LyraBoard, LyraMarket, LyraStrike } from "../utils/types/lyra"

export type VaultsProviderState = {
  markets: string[]
  directions: StrategyType[]
  toggleMarkets: (any: any) => void
  toggleDirections: (StrategyDirection: any) => void
}


export const vaultsInitialState: VaultsProviderState = {
  markets: [],
  directions: [],
  toggleMarkets: (any) => void any,
  toggleDirections: (any) => void any,

}

export type VaultsAction =
  | {
    type: 'SET_MARKET',
    markets: VaultsProviderState['markets']
  }
  | {
    type: 'SET_DIRECTION',
    directions: VaultsProviderState['directions']
  }
  | {
    type: 'RESET_BUILDER_PROVIDER',
  }

export function vaultsReducer(
  state: VaultsProviderState,
  action: VaultsAction
): VaultsProviderState {
  switch (action.type) {
    case 'SET_MARKET':
      return {
        ...state,
        markets: action.markets
      }
    case 'SET_DIRECTION':
      return {
        ...state,
        directions: action.directions
      }
    case 'RESET_BUILDER_PROVIDER':
      return vaultsInitialState
    default:
      throw new Error()
  }
}
