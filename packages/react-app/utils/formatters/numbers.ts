import { BigNumber, utils } from 'ethers'
import { formatUnits, parseUnits, formatEther } from 'ethers/lib/utils'

export type FormatNumberOptions = {
  dps?: number
  minDps?: number
  maxDps?: number
  precision?: number
  showSign?: boolean
}

export type FormatCurrencyOptions = {
  minDecimals?: number
  maxDecimals?: number
  sign?: string
  currencyKey?: string
}

type FormatUSDOptions = FormatNumberOptions

export const SHORT_CRYPTO_CURRENCY_DECIMALS = 4
export const LONG_CRYPTO_CURRENCY_DECIMALS = 8
// default to 0.1% precision
const DEFAULT_PRECISION = 0.001

export function formatNumber(
  value: number | BigNumber,
  options?: FormatNumberOptions
): string {
  const {
    dps,
    minDps: _minDps = 0,
    maxDps: _maxDps = 6,
    precision = DEFAULT_PRECISION,
    showSign = false,
  } = options ?? {}

  const minDps = dps !== undefined ? dps : _minDps
  const maxDps = dps !== undefined ? dps : _maxDps

  // resolve value as number
  let val = 0
  if (BigNumber.isBigNumber(value)) {
    val = fromWei(value)
  } else {
    val = value
  }

  if (isNaN(val)) {
    return 'NaN'
  }

  let numDps = minDps
  let currRoundedVal: number = round(val, numDps)
  for (; numDps <= maxDps; numDps++) {
    currRoundedVal = round(val, numDps)
    const currPrecision = Math.abs((val - currRoundedVal) / val)
    if (currPrecision <= precision) {
      // escape dp increment when we hit desired precision
      break
    }
  }
  const roundedVal = currRoundedVal

  // convert into styled string
  // commas for number part e.g. 1,000,000
  // padded zeroes for dp precision e.g. 0.1000
  const parts = roundedVal.toString().split('.')
  const num = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') // add commas
  const dec = (parts[1] || '').padEnd(minDps, '0')
  const numStr = dec != null && dec.length > 0 ? num + '.' + dec : num
  return roundedVal > 0 && showSign ? '+' + numStr : numStr
}

export const zeroBN = BigNumber.from('0')

export const commifyAndPadDecimals = (value: string, decimals: number) => {
  let formatted = utils.commify(value)
  const comps = formatted.split('.')

  if (comps.length === 2 && comps[1] && comps[1].length !== decimals) {
    const zeros = '0'.repeat(
      comps[1].length > decimals ? decimals : decimals - comps[1].length
    )

    const decimalSuffix = `${comps[1]}${zeros}`
    formatted = `${comps[0]}.${decimalSuffix}`
  }

  return formatted
}

export const fromBigNumber = (
  number: BigNumber,
  decimals: number = 18
): number => {
  return parseFloat(formatUnits(number.toString(), decimals))
}

export function formatPercentage(
  pct: number,
  hidePlus: boolean = false
): string {
  return `${pct > 0 ? (hidePlus ? '' : '+') : ''}${formatNumber(pct * 100)}%`
}

export function from18DecimalBN(val: BigNumber, decimals: number): BigNumber {
  return val.div(BigNumber.from(10).pow(18 - decimals))
}

export function to18DecimalBN(val: BigNumber, decimals: number): BigNumber {
  return val.mul(BigNumber.from(10).pow(18 - decimals))
}

const round = (val: number, dps: number) => {
  const mul = Math.pow(10, dps)
  return Math.round(val * mul) / mul
}

export const fromWei = (number: BigNumber): number => {
  return parseFloat(formatEther(number.toString()))
}

export const formatUSD = (
  price: number | BigNumber,
  options?: FormatUSDOptions
): string => {
  if (typeof price === 'number' && isNaN(price)) {
    return ''
  }
  const numStr = formatNumber(price, { ...options, minDps: 2 })
  const isSigned = numStr.startsWith('-') || numStr.startsWith('+')
  if (isSigned) {
    return `${numStr.slice(0, 1)}$${numStr.slice(1)}`
  } else {
    return `$${numStr}`
  }
}
