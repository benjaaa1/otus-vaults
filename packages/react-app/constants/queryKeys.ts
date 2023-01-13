export const QUERY_KEYS = {
  Leaderboard: {
    Twitter: (handle: string) => ['twitter', handle]
  },
  Vaults: {
    AllVaults: () => ['vaults'],
    Vault: (vaultId: string) => ['vaults', vaultId],
    ManagerVaults: (managerId: string | null | undefined) => [
      'vaults',
      managerId,
    ],
    ManageMyVault: (
      managerId: string | null | undefined,
      vaultId: string | null | undefined
    ) => ['vaults', managerId, vaultId],
    ManageStrikeStrategies: (
      strategyId: string
    ) => ['strikeStrategies', strategyId]
  },
  UserPortfolios: {
    UserPortfolio: (userId: string | null | undefined) => [
      'userPortfolio',
      userId,
    ],
  },
  Lyra: {
    Strike: (market: string, strikeId: number) => [
      'lyraStrike',
      market,
      strikeId,
    ],
    Markets: () => ['lyraMarkets'],
    Quote: (strikeId: number) => ['lyraQuote', strikeId],
  },
  Balance: {
    Susd: (address: string | null | undefined) => ['susd', address],
  },
  Synthetix: {
    Rates: (asset: string) => ['synthetixRates', asset],
  },
}

export default QUERY_KEYS
