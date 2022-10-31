export const getBlockExplorerUrl = (chainId: number) => {
  switch (chainId) {
    case 10: // optimism main
      return 'https://optimistic.etherscan.io/'
      break
    case 420: // optimism goerli
      return 'https://goerli-optimistic.etherscan.io/'
      break
    case 31337: // local
      return 'https://kovan-optimistic.etherscan.io/'
      break
    default:
      break
  }
}
