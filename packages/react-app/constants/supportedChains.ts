import { ArbitrumChainId, EthereumChainId, ChainId, OptimismChainId } from "./networks";

const INFURA_ID_PUBLIC = process.env.NEXT_PUBLIC_INFURA_ID;

type SupportedChain = {
  name: string
  chainId: number

}
export const SupportedChainsList: SupportedChain[] = [
  {
    name: 'Optimism',
    chainId: OptimismChainId.OptimismMainnet
  },
  {
    name: 'Arbitrum',
    chainId: ArbitrumChainId.ArbitrumMainnet
  },
  {
    name: 'Local',
    chainId: EthereumChainId.Local
  }
]

export const SUPPORTED_NETWORKS: Record<ChainId, string> = {
  [OptimismChainId.OptimismMainnet]: `https://optimism-mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
  [OptimismChainId.OptimismGoerli]: `https://optimism-goerli.infura.io/v3/${INFURA_ID_PUBLIC}`,
  [ArbitrumChainId.ArbitrumMainnet]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
  [ArbitrumChainId.ArbitrumGoerli]: `https://arbitrum-goerli.infura.io/v3/${INFURA_ID_PUBLIC}`,
  [EthereumChainId.Local]: `http://127.0.0.1:8545`,
  [EthereumChainId.Mainnet]: `https://mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
  [EthereumChainId.Kovan]: `https:/mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`
}