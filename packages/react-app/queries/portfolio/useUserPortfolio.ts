import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { UserPortfolio } from '../../utils/types/portofolio'
import { Network } from '../../constants/networks'
import { ethers } from 'ethers'

export const useUserPortfolio = () => {
  const { address: userId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<UserPortfolio | null>(
    QUERY_KEYS.UserPortfolios.UserPortfolio(userId?.toLowerCase()),
    async () => {
      if (!userId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($userId: String!) {
            userPortfolios(where: { id: $userId }) {
              id
              account
              balance
              yieldEarned
              userActions {
                timestamp
                txhash
                id
                isDeposit
                amount
                userPortfolio {
                  id
                }
                vault {
                  id
                }
              }
            }
          }
        `,
        { userId: userId.toLowerCase() }
      )
      return response.userPortfolios.length > 0
        ? response.userPortfolios[0]
        : null
    },
    {
      enabled: !!userId,
    }
  )
}

export const useUserPortfolioById = (userId: any, network: ethers.providers.Network | null | undefined) => {

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<UserPortfolio | null>(
    QUERY_KEYS.UserPortfolios.UserPortfolio(userId?.toLowerCase()),
    async () => {
      if (!userId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($userId: String!) {
            userPortfolios(where: { id: $userId }) {
              id
              account
              balance
              yieldEarned
              userActions {
                timestamp
                txhash
                id
                isDeposit
                amount
                userPortfolio {
                  id
                }
                vault {
                  id
                }
              }
            }
          }
        `,
        { userId: userId.toLowerCase() }
      )
      console.log({ response })
      return response.userPortfolios.length > 0
        ? response.userPortfolios[0]
        : null
    },
    {
      enabled: !!userId,
    }
  )
}
