import { useQuery } from 'react-query';
import request, { gql } from 'graphql-request';
import { getOtusEndpoint } from '../utils';
import { useWeb3Context } from '../../context';
import QUERY_KEYS from '../../constants/queryKeys';
import { BigNumberish } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import { commifyAndPadDecimals } from '../../utils/formatters/numbers';

type UserPortfolio = {
  id: string; 
  account: string; 
  balance: string;
  yieldEarned: string;
  userActions: []; 
}

type RawUserPortfolio = {
  id: string; 
  account: string; 
  balance: BigNumberish;
  yieldEarned: BigNumberish;
  userActions: []; 
}

export const useUserPortfolio = () => {

  const { address: userId, network } = useWeb3Context()

	const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<UserPortfolio | null>(
    QUERY_KEYS.UserPortfolios.UserPortfolio(userId?.toLowerCase()),
    async () => {
      if (!userId) return null;
      console.log({ userId })
      const response = await request(
        otusEndpoint,
        gql`
        query($userId: String!) {
          userPortfolios( where: { id: $userId } ) {
            id, 
            account, 
            balance,
            yieldEarned,
            userActions {
              id
              isDeposit
              amount
              vault {
                id
              }
            }
          },
        }
        `,
        { userId: userId.toLowerCase() }
      );
      console.log({ response })
      return response.userPortfolios.length > 0 ? parseUserPortfolio(response.userPortfolios[0]) : null;
    },
    {
      enabled: !!userId,
    }
  );
}

const parseUserPortfolio = (user: RawUserPortfolio): UserPortfolio => {
  return {
    ...user, 
    balance: commifyAndPadDecimals(formatUnits(user.balance.toString()).toString(), 2),
    yieldEarned: commifyAndPadDecimals(formatUnits(user.balance.toString()).toString(), 2)
  }
}