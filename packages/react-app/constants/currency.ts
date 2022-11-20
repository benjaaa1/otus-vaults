import keyBy from 'lodash/keyBy'

// TODO: standardize this
export type Category =
  | 'crypto'
  | 'forex'
  | 'equities'
  | 'index'
  | 'commodity'
  | 'inverse'

export const CATEGORY: Category[] = [
  'crypto',
  'forex',
  'equities',
  'index',
  'commodity',
  'inverse',
]
export const CATEGORY_MAP = keyBy(CATEGORY)

export const CRYPTO_CURRENCY = [
  'KNC',
  'COMP',
  'REN',
  'LEND',
  'SNX',
  'BTC',
  'ETH',
  'XRP',
  'BCH',
  'LTC',
  'EOS',
  'BNB',
  'XTZ',
  'XMR',
  'ADA',
  'LINK',
  'TRX',
  'DASH',
  'ETC',
]

export const CRYPTO_CURRENCY_MAP = keyBy(CRYPTO_CURRENCY)

export const SYNTH_DECIMALS = 18

export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export declare type CurrencyKey = keyof typeof Synths

enum Synths {
  sUSD = 'sUSD',
  sEUR = 'sEUR',
  sJPY = 'sJPY',
  sAUD = 'sAUD',
  sGBP = 'sGBP',
  sCHF = 'sCHF',
  sKRW = 'sKRW',
  sBTC = 'sBTC',
  sETH = 'sETH',
  sLINK = 'sLINK',
  sADA = 'sADA',
  sAAVE = 'sAAVE',
  sDOT = 'sDOT',
  sETHBTC = 'sETHBTC',
  sDEFI = 'sDEFI',
  sSOL = 'sSOL',
}

export const CURRENCY_BY_ADDRESS = {
  10: {},
  420: {
    '0x2400d0469bfda59fb0233c3027349d83f1a0f4c8': 'ETH',
  },
  31337: {},
}

export const CURRENCIES: Currency = {
  10: {
    'ETH': '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
  },
  420: {
    'ETH': '0x2400d0469bfda59fb0233c3027349d83f1a0f4c8'
  },
  31337: {
    'ETH': '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
  }
}

type Currency = {
  [key: number]: Record<string, string>
}