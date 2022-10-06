export type MarketType = 'ETH' | 'sETH' | 'sBTC' | 'sSOL' | 'sLINK'

export const BYTES32_MARKET: Record<string, string> = {
  ETH: '0x7345544800000000000000000000000000000000000000000000000000000000',
  sETH: '0x7345544800000000000000000000000000000000000000000000000000000000',
  sBTC: '',
  sSOL: '',
  sLINK: '',
}

export const getMarketInBytes = (market: string): string => {
  return BYTES32_MARKET[market]
}
