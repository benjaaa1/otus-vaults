import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { AllAvailableVaults, Vault } from '../../utils/types/vault'

export const useVaultProducts = () => {
  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network);
  if (!otusEndpoint) return;
  return useQuery<AllAvailableVaults>(
    QUERY_KEYS.Vaults.AllVaults(),
    async () => {

      const response = await request(
        otusEndpoint,
        gql`
            query AllAvailableVaults {
              vaults {
                id
                manager {
                  id
                  twitter
                }
                round
                isActive
                isPublic
                strategy
                name
                description
                totalDeposit
                performanceFee
                managementFee
                asset
                vaultCap
                userActions {
                  id
                  amount 
                  isDeposit
                }
                vaultTrades {
                  id
                  txhash
                  strikeId
                  positionId
                  premiumEarned
                  strikePrice
                  size
                  openedAt
                  expiry
                  optionType
                }
                strategy {
                  id 
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
                  }
                }
              }
            }
          `,
        {}
      )
      return response ? response : null

    },
    {
      enabled: true,
      staleTime: Infinity,
      cacheTime: Infinity
    }
  )
}

export const useVaultProduct = (vaultId: any) => {
  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);
  return useQuery<Vault>(
    QUERY_KEYS.Vaults.Vault(vaultId),
    async () => {
      if (!vaultId) return null
      const responses = await request(
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
              isActive
              isPublic
              strategy
              name
              description
              totalDeposit
              performanceFee
              managementFee
              asset
              vaultCap
              userActions {
                id
                timestamp
                isDeposit
                amount
                vault
                userPortfolio
              }
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
                }
                dynamicHedgeStrategy {
                  id
                  maxHedgeAttempts
                  maxLeverageSize
                  threshold
                }
                strikeStrategies {
                  id
                  optionType
                  maxVol
                  maxDeltaGap
                  targetDelta
                  minVol
                  maxVolVariance
                }
              }
              vaultTrades {
                id
                txhash
                strikeId
                positionId
                premiumEarned
                strikePrice
                size
                openedAt
                expiry
              }
            }
          }
        `,
        { vaultId: vaultId?.toLowerCase() }
      )

      return responses.vaults.length > 0 ? responses.vaults[0] : null
    },
    {
      enabled: !!vaultId,
    }
  )
}
