export type MarketType = 'ETH' | 'sETH' | 'sBTC' | 'sSOL' | 'sLINK'

export const AVAILABLE_MARKETS_CHAIN: Record<number, Record<string, string>[]> = {
  1337: [
    {
      name: 'ETH',
      id: '0x7345544800000000000000000000000000000000000000000000000000000000'
    }
  ],
  420: [
    {
      name: 'ETH',
      id: '0x7345544800000000000000000000000000000000000000000000000000000000'
    }
  ],
  10: [
    {
      name: 'ETH',
      id: '0x7345544800000000000000000000000000000000000000000000000000000000'
    },
    {
      name: 'BTC',
      id: '0'
    }
  ]
}



export const BYTES32_MARKET: Record<string, string> = {
  ETH: '0x7345544800000000000000000000000000000000000000000000000000000000',
  sETH: '0x7345544800000000000000000000000000000000000000000000000000000000',
  BTC: '',
  sBTC: '',
  sSOL: '',
  sLINK: '',
}

export const getMarketInBytes = (market: string): string => {
  return BYTES32_MARKET[market]
}
