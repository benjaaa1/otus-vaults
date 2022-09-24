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
