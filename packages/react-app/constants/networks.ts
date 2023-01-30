const INFURA_ID_PUBLIC = process.env.NEXT_PUBLIC_INFURA_ID;

export enum OptimismChainId {
  OptimismMainnet = 10,
  OptimismGoerli = 420,
  Local = 31337, // Optimism
}

export enum ArbitrumChainId {
  ArbitrumMainnet = 42161,
  ArbitrumGoerli = 421613,
}

export enum EthereumChainId {
  Mainnet = 1,
  Kovan = 42,
  Local = 31337,
}

export type ChainId = EthereumChainId | OptimismChainId | ArbitrumChainId

export enum Network {
  Optimism = 'Optimism',
  Ethereum = 'Ethereum',
}

export type NetworkConfig = {
  name: string
  shortName: string
  chainId: ChainId
  network: Network
  walletRpcUrl: string
  readRpcUrl: string
  blockExplorerUrl: string
  iconUrls: string[]
}

export const NETWORK_CONFIGS: Record<ChainId, NetworkConfig> = {
  [EthereumChainId.Mainnet]: {
    name: 'Mainnet',
    shortName: 'Mainnet',
    chainId: EthereumChainId.Mainnet,
    network: Network.Ethereum,
    walletRpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
    readRpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
    blockExplorerUrl: 'https://etherscan.io/',
    iconUrls: [],
  },
  [EthereumChainId.Kovan]: {
    name: 'Kovan',
    shortName: 'Kovan',
    chainId: EthereumChainId.Kovan,
    network: Network.Ethereum,
    walletRpcUrl: `https://kovan.infura.io/v3/${INFURA_ID_PUBLIC}`,
    readRpcUrl: `https://kovan.infura.io/v3/${INFURA_ID_PUBLIC}`,
    blockExplorerUrl: 'https://kovan.etherscan.io',
    iconUrls: [],
  },
  [EthereumChainId.Local]: {
    name: 'Local',
    shortName: 'Local',
    chainId: EthereumChainId.Local,
    network: Network.Ethereum,
    walletRpcUrl: 'http://127.0.0.1:8545',
    readRpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: 'https://kovan-explorer.optimism.io/',
    iconUrls: [
      'https://optimism.io/images/metamask_icon.svg',
      'https://optimism.io/images/metamask_icon.png',
    ],
  },
  [OptimismChainId.OptimismMainnet]: {
    name: 'Optimistic Ethereum',
    shortName: 'Optimism',
    chainId: OptimismChainId.OptimismMainnet,
    network: Network.Optimism,
    walletRpcUrl: 'https://mainnet.optimism.io',
    readRpcUrl: `https://optimism-mainnet.infura.io/v3/${INFURA_ID_PUBLIC}`,
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    iconUrls: [
      'https://optimism.io/images/metamask_icon.svg',
      'https://optimism.io/images/metamask_icon.png',
    ],
  },
  [OptimismChainId.OptimismGoerli]: {
    name: 'Optimistic Ethereum (Goerli)',
    shortName: 'Optimistic Goerli',
    chainId: OptimismChainId.OptimismGoerli,
    network: Network.Optimism,
    walletRpcUrl: 'https://kovan.optimism.io',
    readRpcUrl: `https://optimism-kovan.infura.io/v3/${INFURA_ID_PUBLIC}`,
    blockExplorerUrl: 'https://kovan-explorer.optimism.io',
    iconUrls: [
      'https://optimism.io/images/metamask_icon.svg',
      'https://optimism.io/images/metamask_icon.png',
    ],
  },
  [OptimismChainId.Local]: {
    name: 'Local',
    shortName: 'Local',
    chainId: OptimismChainId.Local,
    network: Network.Optimism,
    walletRpcUrl: 'http://127.0.0.1:8545',
    readRpcUrl: 'http://127.0.0.1:8545',
    blockExplorerUrl: 'https://kovan-explorer.optimism.io/',
    iconUrls: [
      'https://optimism.io/images/metamask_icon.svg',
      'https://optimism.io/images/metamask_icon.png',
    ],
  },
}
