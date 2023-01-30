import { ArbitrumChainId, OptimismChainId } from "./networks";

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
  }
]
