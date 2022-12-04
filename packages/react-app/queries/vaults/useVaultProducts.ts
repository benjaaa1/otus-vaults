import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { BigNumber } from 'ethers'
import { VaultTrade } from '../myVaults/useMyVaults'

export type VaultStrategy = {
  id: string
  allowedMarkets: string[]
  collatBuffer: BigNumber
  collatPercent: BigNumber
  minTimeToExpiry: number
  maxTimeToExpiry: number
  minTradeInterval: number
  gwavPeriod: number
}

type DynamicHedgeStrategy = {
  id: string
  period: number
  maxHedgeAttempts: BigNumber
  maxLeverageSize: BigNumber
  threshold: BigNumber
}

export type StrikeStrategy = {
  id: string
  targetDelta: BigNumber
  maxDeltaGap: BigNumber
  minVol: BigNumber
  maxVol: BigNumber
  maxVolVariance: BigNumber
  optionType: BigNumber
}

type Strategy = {
  id: string
  latestUpdate: number
  hedgeType: number
  vaultStrategy: VaultStrategy
  dynamicHedgeStrategy: DynamicHedgeStrategy
  strikeStrategies: StrikeStrategy[]
}

export type Vault = {
  id: string
  manager: string
  round: number
  isActive: boolean
  isPublic: boolean
  inProgress: boolean
  strategy: Strategy
  vaultTrades: VaultTrade[]
  name: string
  description: string
  totalDeposit: BigNumber
  performanceFee: BigNumber
  managementFee: BigNumber
  asset: string
  vaultCap: BigNumber
}

type AllAvailableVaults = {
  vaults?: Vault[]
  isLoading: boolean
  isSuccess: boolean
}

export const useVaultProducts = () => {
  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network);
  if (!otusEndpoint) return;
  return useQuery<AllAvailableVaults>(
    QUERY_KEYS.Vaults.AllVaults(),
    async () => {
      try {
        const response = await request(
          otusEndpoint,
          gql`
            query AllAvailableVaults {
              vaults {
                id
                manager
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
      } catch (e) {
        console.log(e)
        return null
      }
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
              manager
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
