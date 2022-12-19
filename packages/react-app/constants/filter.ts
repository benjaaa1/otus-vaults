import { BYTES32_MARKET } from "./markets";

export const MARKET_FILTER: Record<number, Record<string, string>[]> = {
  31337: [
    {
      name: 'ETH',
      id: BYTES32_MARKET.ETH
    }
  ],
  420: [
    {
      name: 'ETH',
      id: BYTES32_MARKET.ETH
    }
  ],
  10: [
    {
      name: 'ETH',
      id: BYTES32_MARKET.ETH
    },
    {
      name: 'BTC',
      id: '0'
    }
  ]
}

export const OPTION_TYPE_FILTER: Array<Record<string, any>> = [
  {
    name: 'Long Call',
    id: 0
  },
  {
    name: 'Long Put',
    id: 1
  },
  {
    name: 'Sell Call',
    id: 3
  },
  {
    name: 'Sell Put',
    id: 4
  }
]

export const NETWORK_FILTER: Array<Record<string, any>> = [
  {
    name: 'Optimism',
    id: 0
  },
  {
    name: 'Arbitrum',
    id: 1
  }
]