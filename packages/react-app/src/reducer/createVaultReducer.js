export const HOUR_SEC = 60 * 60;
export const DAY_SEC = 24 * HOUR_SEC;
export const WEEK_SEC = 7 * DAY_SEC;

export const createVaultInitialState = {
  markets: [],
  market_id: null,
  optionMarket: '0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2', 
  vaultStrategy: {
    collatBuffer: 1.2, 
    collatPercent: .35,
    minTimeToExpiry: 0,
    maxTimeToExpiry: 4,
    minTradeInterval: 10,
    gwavPeriod: 10,
  },
  vaultInformation: {
    name: '',
    tokenName: '',
    tokenSymbol: '',
    description: '',
    isPublic: false,
    managementFee: 0,
    performanceFee: 0
  },
  vaultParams: {
    decimals: 18,
    cap: 50000, // 50,000 usd cap
    asset: '0xD30a35282c2E2db07d9dAC69Bf3D45a975Bc85D1' // susd 
  }
}

export const createVaultReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LYRA_MARKETS':
      console.log(action.payload); 
      return { ...state, markets: action.payload }
    case 'SET_SELECTED_MARKET': 
      const {vaultInformation} = state;
      const { tokenName, tokenSymbol } = vaultInformation;
      return { ...state, market_id: action.payload.id, vaultInformation: { ...vaultInformation,  tokenName: `${tokenName}-${action.payload.name}`, tokenSymbol: `${tokenSymbol}-${action.payload.name}` } }
    case 'UPDATE_VAULT_STRATEGY': 
      return { ...state, vaultStrategy: { ...state.vaultStrategy, [action.payload.field]: action.payload.value } }
    case 'UPDATE_VAULT_INFORMATION': 
      return { ...state, vaultInformation: { ...state.vaultInformation, [action.payload.field]: action.payload.value } }
    case 'UPDATE_VAULT_NAMES_INFORMATION': 
      return { ...state, 
        vaultInformation: { 
          ...state.vaultInformation, 
          name: action.payload.name,
          tokenName: action.payload.tokenName,
          tokenSymbol: action.payload.tokenSymbol 
        } 
      }
    case 'UPDATE_VAULT_PARAMS': 
      return { ...state, vaultParams: { ...state.vaultParams, [action.payload.field]: action.payload.value } }
    default: 
      return { ...state }  
  }
}
