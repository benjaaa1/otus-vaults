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
import { VaultTrade } from '../queries/myVaults/useMyVaults'

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
    builtStrikeToHedge,
    builtStrikeToClose,
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

  const updateTradeSize = (strike: LyraStrike) => {
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

  const toggleToHedge = (hedge: VaultTrade) => {
    console.log({ hedge })

    if (builtStrikeToHedge != null && builtStrikeToHedge.id == hedge.id) {
      dispatch({
        type: 'ADD_NEW_HEDGE',
        builtStrikeToHedge: null,
      } as VaultManagerAction)
    } else {
      dispatch({
        type: 'ADD_NEW_HEDGE',
        builtStrikeToHedge: hedge,
      } as VaultManagerAction)
    }

    dispatch({
      type: 'ADD_NEW_CLOSE',
      builtStrikeToClose: null,
    } as VaultManagerAction)
  }

  const toggleToClose = (close: VaultTrade) => {
    console.log({ close })

    if (builtStrikeToClose != null && builtStrikeToClose.id == close.id) {
      dispatch({
        type: 'ADD_NEW_CLOSE',
        builtStrikeToClose: null,
      } as VaultManagerAction)
    } else {
      dispatch({
        type: 'ADD_NEW_CLOSE',
        builtStrikeToClose: close,
      } as VaultManagerAction)
    }

    dispatch({
      type: 'ADD_NEW_HEDGE',
      builtStrikeToHedge: null,
    } as VaultManagerAction)
  }

  // const selectHedge = (position: VaultTrade) => {}

  // const selectClose = (position: VaultTrade) => {}

  return {
    vaultInfo,
    vaultParams,
    currentStrikes,
    currentHedges,
    strategies,
    builtTrades,
    builtStrikeToHedge,
    builtStrikeToClose,
    toggleTrade,
    updateTradeSize,
    toggleToHedge,
    toggleToClose,
  }
}
