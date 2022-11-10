import { useQuery } from 'react-query'
import request, { gql } from 'graphql-request'
import { getFuturesEndpoint } from '../utils'
import { useWeb3Context } from '../../context'
import QUERY_KEYS from '../../constants/queryKeys'

export const useLatestRates = (asset: string) => {
  const { network } = useWeb3Context()

  const futuresEndpoint = getFuturesEndpoint(network) // getOtusEndpoint(network);
  return useQuery<number | null>(
    QUERY_KEYS.Synthetix.Rates(asset),
    async () => {
      if (!asset) return null

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
        { asset: asset }
      )
      console.log({ responses })
      return responses.latestRates.length > 0
        ? parseFloat(responses.latestRates[0].rate)
        : null
    },
    {
      enabled: !!asset,
      refetchInterval: 6000,
    }
  )
}
