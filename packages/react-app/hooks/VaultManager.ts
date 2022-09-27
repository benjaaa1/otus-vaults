import { useEffect, useReducer, useCallback } from 'react'
import { BigNumber, ethers } from 'ethers'

import {
  VaultManagerProviderState,
  VaultManagerAction,
  vaultManagerInitialState,
  vaultManagerReducer,
} from '../reducers'

import { toast } from 'react-toastify'
import { getStrikeQuote, LyraStrike } from '../queries/lyra/useLyra'

export const useVaultManager = () => {
  const [state, dispatch] = useReducer(
    vaultManagerReducer,
    vaultManagerInitialState
  )
  const {
    vaultInfo,
    vaultParams,
    currentStrikes,
    currentHedges,
    strategies,
    builtTrades,
    builtHedges,
  } = state

  const toggleTrade = (trade: LyraStrike) => {
    if (
      builtTrades?.find(
        (existingTrade) =>
          existingTrade.id == trade.id &&
          existingTrade.selectedOptionType == trade.selectedOptionType
      )
    ) {
      const filtered = builtTrades?.filter(
        (existingTrade) =>
          existingTrade.id != trade.id ||
          existingTrade.selectedOptionType != trade.selectedOptionType
      )

      dispatch({
        type: 'REMOVE_NEW_TRADE',
        builtTrades: filtered,
      } as VaultManagerAction)
    } else {
      dispatch({
        type: 'ADD_NEW_TRADE',
        builtTrades: builtTrades?.concat([trade]),
      } as VaultManagerAction)
    }
  }

  const updateTradeSize = (strike) => {
    console.log({ strike })
    const _updatedBuiltTrades = builtTrades?.map((existingTrade) => {
      if (
        existingTrade.id == strike.id &&
        existingTrade.selectedOptionType == strike.selectedOptionType
      ) {
        return strike
      } else {
        return existingTrade
      }
    })

    dispatch({
      type: 'UPDATE_NEW_TRADE',
      builtTrades: _updatedBuiltTrades,
    })
  }

  const addToHedges = (hedge) => {
    dispatch({
      type: 'ADD_NEW_HEDGE',
      builtHedges: builtHedges?.concat([hedge]),
    } as VaultManagerAction)
  }

  const removeFromHedges = (hedge) => {
    dispatch({
      type: 'REMOVE_NEW_HEDGE',
      builtHedges: builtHedges?.filter(
        (existingTrade) => existingTrade.strikeId != hedge.strikeId
      ),
    } as VaultManagerAction)
  }

  const executeTrade = () => {
    // builttrades will be transformed here
  }

  return {
    vaultInfo,
    vaultParams,
    currentStrikes,
    currentHedges,
    strategies,
    builtTrades,
    builtHedges,
    toggleTrade,
    updateTradeSize,
    addToHedges,
    removeFromHedges,
  }
}
