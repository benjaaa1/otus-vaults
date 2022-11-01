import { ONE_BN } from "../constants/bn";

const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;

export const vaultStrategy = {
  collatBuffer: 120, 
  collatPercent: 35,
  minTimeToExpiry: 0,
  maxTimeToExpiry: WEEK_SEC * 8,
  minTradeInterval: 600,
  gwavPeriod: 600,
}

export const currentHedgeStrategy = {
  hedgePercentage: .2, 
  maxHedgeAttempts: 4,
  leverageSize: 2,
  stopLossLimit: .1,
}

export const strikeTrade = {
  optionType: 0, 
  size: 1,
  futuresHedge: false, 
  strikeId: 0,
  isCall: true, 
  isBuy: true,
  _strike: null
}

export const strikeStrategy = {
  targetDelta: .2,
  maxDeltaGap: 0.05,
  minVol: .8,
  maxVol: 1.3,
  maxVolVariance: .1,
  optionType: 0
}

export const strategyInitialState = {
  vaultStrategy: vaultStrategy,
  hedgeStrategy: currentHedgeStrategy,
  strikeStrategy: {
    0: strikeStrategy, // LONG_CALL
    1: { ...strikeStrategy, optionType: 1 }, // LONG_PUT
    3: { ...strikeStrategy, optionType: 3 }, // SHORT_CALL_QUOTE
    4: { ...strikeStrategy, optionType: 4 } // SHORT_PUT_QUOTE
  },
  currentRoundStrikes: [],
  market: 'eth', 
  needsQuotesUpdated: false,
  lyraMarket: null, 
  liveBoards: {},
  liveBoardStrikes: [],
  liveStrikes: {},
  selectedBoard: null,
  selectedStrike: null, 
  currentBoard: null,
  currentStrikes: [],
  activeCurrentStrikeIndex: null,
  activeBoardId: null,
  size: 1,
}

export const strategyReducer = (state, action) => {
  switch (action.type) {
    // need to load some of these strategies, strikes
    case 'SET_CURRENT_ROUND_STRIKES': 
      console.log({ currentRoundStrikes: action.payload })
      return { ...state, currentRoundStrikes: action.payload }
    case 'UPDATE_MARKET':
      return { ...state, market: action.payload };
    case 'UPDATE_LYRA_MARKET':
      return { ...state, lyraMarket: action.payload };
    case 'SET_LIVE_BOARDS':
      return { ...state, liveBoards: action.payload };
    case 'UPDATE_STRIKES':
      return { ...state, strikes: action.payload };
    case 'SET_SELECTED_BOARD':
      return { ...state, selectedBoard: action.payload.selectedBoard, currentStrikes: [], liveBoardStrikes: action.payload.liveBoardStrikes }; //, needsQuotesUpdated: true
    case 'UPDATE_ROUND_STRATEGY': 
      console.log({ action })
      return { ...state, vaultStrategy: { ...state.vaultStrategy, [action.payload.id]: action.payload.value }}
    case 'RESET_ROUND_STRATEGY': 
      return { ...state, vaultStrategy: vaultStrategy };
    case 'UPDATE_HEDGE_STRATEGY': 
      return { ...state, hedgeStrategy: { ...state.hedgeStrategy, [action.payload.id]: action.payload.value }}
    case 'RESET_HEDGE_STRATEGY': 
      return { ...state, hedgeStrategy: currentHedgeStrategy };
    case 'UPDATE_STRIKE_STRATEGY':
      const { value, id, _optionType } = action.payload; 
      const { strikeStrategy } = state; 
      const updatedStrategy = { ...strikeStrategy, [_optionType]: { ...strikeStrategy[_optionType], [id]: value } }; 
      console.log({ updatedStrategy })
      return { ...state, strikeStrategy: updatedStrategy };
    case 'ADD_CURRENT_STRIKE':
      return { ...state, currentStrikes: state.currentStrikes.concat(strikeTrade) };
    case 'UPDATE_CURRENT_STRIKE':
      const _strike = action.payload.strike; 
      const optionType = parseInt(action.payload.optionType); 
      const isBuy = optionType == 0 || optionType == 1 ? true : false; 
      const isCall = optionType == 0 || optionType == 3 ? true : false; 
      return { ...state, currentStrikes: state.currentStrikes.map((cs, index) => {
          if(index == action.payload.index) {
            console.log({ _strike })
            return { ...cs, _strike, optionType, isBuy, isCall }
          }
          return cs; 
        })
      }
    case 'REMOVE_CURRENT_STRIKE':
      const currentStrikes = state.currentStrikes; 
      const index = action.payload; 
      return { ...state, currentStrikes: [ ...currentStrikes.slice(0, index), ...currentStrikes.slice(index + 1) ] }
    case 'ACTIVE_CURRENT_STRIKE_INDEX':
      return { ...state, activeCurrentStrikeIndex: action.payload };
    case 'UPDATE_STRIKES_WITH_PRICING':
      const { _index, _liveStrikesWithFees } = action.payload; 
      return { ...state, liveStrikes: { ...state.liveStrikes, [_index]: _liveStrikesWithFees } };
    // case 'UPDATE_CURRENT_STRIKE_STRATEGY':
    //   const { value, id, activeIndex } = action.payload; 
    //   return { ...state, currentStrikes: state.currentStrikes.map((cs, index) => {
    //     if(activeIndex == index) {
    //       return { ...cs, [id]: value }; 
    //     }
    //     return cs; 
    //   }) };
    case 'UPDATE_SIZE':
      const { size } = action.payload; 
      return { ...state, size };
    // case 'UPDATE_ACTIVE_BOARD_ID':
    //   const { size } = action.payload; 
    //   return { ...state, size };
    default: 
      return { ...state }  
  }
}

