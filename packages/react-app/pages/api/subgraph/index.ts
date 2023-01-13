import request, { gql } from 'graphql-request'

export const getMyVault = async (otusEndpoint: string, vaultId: string) => {

  return await request(
    otusEndpoint,
    gql`
      query ($vaultId: String!) {
        vaults(where: { id: $vaultId }) {
          id
          manager {
            id
            twitter
          }
          round
          createdAt
          isActive
          isPublic
          inProgress
          strategy
          name
          description
          totalDeposit
          performanceFee
          managementFee
          asset
          vaultCap
          strategy {
            id
            latestUpdate
            hedgeType
            vaultStrategy {
              id
              collatBuffer
              collatPercent
              minTimeToExpiry
              maxTimeToExpiry
              minTradeInterval
              gwavPeriod
              allowedMarkets
              hedgeReserve
            }
            dynamicHedgeStrategy {
              id
              maxHedgeAttempts
              maxLeverageSize
              threshold
            }
          }
          vaultTrades {
            id
            txhash
            strikeId
            positionId
            premiumEarned
            strikePrice
            openedAt
            expiry
            optionType
          }
        }
      }
    `,
    { vaultId: vaultId?.toLowerCase() }
  )

}