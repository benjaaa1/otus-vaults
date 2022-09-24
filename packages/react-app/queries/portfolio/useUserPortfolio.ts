import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getOtusEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'
import { BigNumber, BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import {
  commifyAndPadDecimals,
  fromBigNumber,
} from '../../utils/formatters/numbers'

export type UserAction = {
  id: string
  txhash: string
  timestamp: string | any
  amount: BigNumber
  isDeposit: boolean
  vault: string
}

type UserPortfolio = {
  id: string
  account: string
  balance: BigNumberish
  yieldEarned: BigNumberish
  userActions: UserAction[]
}

export type RawUserAction = {
  id: string
  txhash: string
  timestamp: BigNumber
  amount: BigNumber
  isDeposit: boolean
  vault?: any
}

type RawUserPortfolio = {
  id: string
  account: string
  balance: BigNumberish
  yieldEarned: BigNumberish
  userActions: any[]
}

export const useUserPortfolio = () => {
  const { address: userId, network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<UserPortfolio | null>(
    QUERY_KEYS.UserPortfolios.UserPortfolio(userId?.toLowerCase()),
    async () => {
      if (!userId) return null
      console.log({ userId })
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
                id
                isDeposit
                amount
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
        ? parseUserPortfolio(response.userPortfolios[0])
        : null
    },
    {
      enabled: !!userId,
    }
  )
}

const parseUserPortfolio = (user: RawUserPortfolio): UserPortfolio => {
  const { userActions } = user
  console.log({ userActions })

  return {
    ...user,
    userActions: userActions.length > 0 ? parseUserActions(userActions) : [],
  }
}

const parseUserActions = (userActions: RawUserAction[]): UserAction[] => {
  return userActions.map((action) => {
    return {
      ...action,
      vault: action.vault.id,
    }
  })
}
