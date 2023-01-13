import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getFuturesEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'

export const useLatestRates = (asset: string) => {
  const { network } = useWeb3Context()

  const futuresEndpoint = getFuturesEndpoint(network) // getOtusEndpoint(network);
  return useQuery<number | number>(
    QUERY_KEYS.Synthetix.Rates(asset),
    async () => {
      if (!asset) return 0

      const responses = await request(
        futuresEndpoint,
        gql`
          query ($asset: String!) {
            latestRates(where: { id: $asset }) {
              id
              rate
            }
          }
        `,
        { asset: asset.toUpperCase() }
      )

      return responses.latestRates.length > 0
        ? parseFloat(responses.latestRates[0].rate)
        : 0
    },
    {
      enabled: !!asset,
      refetchInterval: 60000,
    }
  )
}
