import keyBy from 'lodash/keyBy'
import { ArbitrumChainId, OptimismChainId } from './networks'

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

export const CURRENCIES: Currency = {
  [OptimismChainId.OptimismMainnet]: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e', //susd
  [OptimismChainId.OptimismGoerli]: '0x42688EcDA9Dd35cbB44C90Ad53734EE0f30d0E57',
  [OptimismChainId.Local]: '0x42688EcDA9Dd35cbB44C90Ad53734EE0f30d0E57',
  [ArbitrumChainId.ArbitrumMainnet]: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e', // usdc
  [ArbitrumChainId.ArbitrumGoerli]: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' // usdc
}

type Currency = {
  [key: number]: string
}