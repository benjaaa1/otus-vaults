import { useCallback, useEffect, useReducer, useState } from 'react'
import { StrategyDirection, StrategyType } from '../utils/types/builder';
import { LyraBoard, LyraMarket, LyraStrike } from '../utils/types/lyra';
import { fromBigNumber, toBN } from '../utils/formatters/numbers';

import {
  VaultsProviderState,
  VaultsAction,
  vaultsInitialState,
  vaultsReducer,
} from '../reducers'

export const useVaults = () => {
  const [state, dispatch] = useReducer(
    vaultsReducer,
    vaultsInitialState
  );

  const {
    markets,
    directions
  } = state;

  const toggleMarkets = (_market: string) => {
    const _markets = markets.includes(_market) ? markets.filter(market => _market !== market) : markets.concat([_market]);
    dispatch({
      type: 'SET_MARKET',
      markets: _markets
    })
  }

  const toggleDirections = (_directionId: StrategyType) => {
    const _directions = directions.includes(_directionId) ? directions.filter(directionId => _directionId !== directionId) : directions.concat([_directionId]);
    dispatch({
      type: 'SET_DIRECTION',
      directions: _directions
    })
  }

  return {
    markets,
    directions,
    toggleMarkets,
    toggleDirections
  } as VaultsProviderState
}


