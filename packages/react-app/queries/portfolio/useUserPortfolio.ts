import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { UserPortfolio } from '../../utils/types/portofolio'

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
