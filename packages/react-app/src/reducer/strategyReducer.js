import { ONE_BN } from "../constants/bn";

const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;

export const vaultStrategy = {
  collatBuffer: 1.2, 
  collatPercent: .35,
  minTimeToExpiry: 0,
  maxTimeToExpiry: WEEK_SEC * 8,
  minTradeInterval: 600,
  gwavPeriod: 600,
}

export const currentHedgeStrategy = {
  hedgePercentage: .2, 
  maxHedgeAttempts: 4,
  limitStrikePricePercent: .0005,
  leverageSize: 2,
  stopLossLimit: .001,
}

export const hedgeStrategy = {
  hedgePercentage: 1.2,
  maxHedgeAttempts: 5,
  limitStrikePricePercent: .2,
  leverageSize: 2,
  stopLossLimit: .001
}

export const strategyInitialState = {
  strategy: vaultStrategy,
  hedgeStrategy: currentHedgeStrategy,
  market: 'eth', 
  needsQuotesUpdated: false,
  lyraMarket: null, 
  liveBoards: {},
  liveStrikes: [],
  selectedBoard: null,
  selectedStrike: null, 
  currentBoard: null,
  currentStrikes: [],
  activeCurrentStrikeIndex: null
}

export const strikeStrategy = {
  targetDelta: .2,
  maxDeltaGap: 0.05,
  minVol: .8,
  maxVol: 1.3,
  maxVolVariance: .1,
  optionType: 0, 
  isCall: true, 
  isBuy: true,
  size: ONE_BN,
  _strike: null
}

export const strategyReducer = (state, action) => {
  console.log('in reducer', { state, action })
  switch (action.type) {
    case 'UPDATE_STRATEGY': 
      return { ...state, strategy: { ...state.strategy, [action.field]: action.payload }}
    case 'UPDATE_HEDGE_STRATEGY': 
      return { ...state, hedgeStrategy: { ...state.hedgeStrategy, [action.field]: action.payload }}
    case 'UPDATE_MARKET':
      return { ...state, market: action.payload };
    case 'UPDATE_LYRA_MARKET':
      return { ...state, lyraMarket: action.payload };
    case 'SET_LIVE_BOARDS':
      return { ...state, liveBoards: action.payload };
    case 'SET_LIVE_STRIKES':
      return { ...state, selectedBoard: state.liveBoards[action.payload], liveStrikes: state.liveBoards[action.payload].strikes };
    case 'UPDATE_STRIKES':
      return { ...state, strikes: action.payload };
    case 'SET_SELECTED_BOARD':
      return { ...state, selectedBoard: action.payload.selectedBoard, liveStrikes: action.payload.liveStrikes }; //, needsQuotesUpdated: true
    case 'ADD_CURRENT_STRIKE':
      return { ...state, currentStrikes: state.currentStrikes.concat(strikeStrategy) };
    case 'UPDATE_CURRENT_STRIKE':
      const _strike = action.payload.strike; 
      return { ...state, currentStrikes: state.currentStrikes.map((cs, index) => {
          if(index == action.payload.index) {
            console.log({ _strike })
            return { ...cs, _strike }
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
    case 'UPDATE_STRIKES_WITH_PREMIUMS':
      const formattedStrikeQuotes = action.payload; 
      const { liveStrikes } = state; 
      const _liveStrikes = liveStrikes.map(strike => {
        return { ...strike, ...formattedStrikeQuotes[strike.id] }
      }) 
      return { ...state, liveStrikes: _liveStrikes, needsQuotesUpdated: false  };
    case 'SET_CURRENT_STRIKE_OPTION_TYPE': 
      return { ...state, currentStrikes: state.currentStrikes.map((cs, index) => {
        if(action.payload.index == index) {
          const { strike } = cs; 
          const optionType = parseInt(action.payload.value); 
          const isBuy = optionType == 0 || optionType == 1 ? true : false; 
          const isCall = optionType == 0 || optionType == 1 ? true : false; 
          return { ...cs, optionType, isBuy, isCall }; 
        }
        return cs; 
      }) };
    case 'UPDATE_CURRENT_STRIKE_STRATEGY':
      const { value, id, activeIndex } = action.payload; 
      return { ...state, currentStrikes: state.currentStrikes.map((cs, index) => {
        if(activeIndex == index) {
          return { ...cs, [id]: value }; 
        }
        return cs; 
      }) };
    default: 
      return { ...state }  
  }
}

