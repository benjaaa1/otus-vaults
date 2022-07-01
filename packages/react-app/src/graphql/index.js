import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const APIURL = 'https://api.thegraph.com/subgraphs/name/kwenta/optimism-main'

const client = new ApolloClient({
  uri: APIURL,
  cache: new InMemoryCache(),
})

const getAverageFundingRateForMarkets = `
  query fundingRateUpdates($market: String!, $minTimestamp: BigInt!) {
    # last before timestamp
    first: fundingRateUpdates(
      first: 1
      where: { market: $market, timestamp_lt: $minTimestamp }
      orderBy: sequenceLength
      orderDirection: desc
    ) {
      timestamp
      funding
    }
    # first after timestamp
    next: fundingRateUpdates(
      first: 1
      where: { market: $market, timestamp_gt: $minTimestamp }
      orderBy: sequenceLength
      orderDirection: asc
    ) {
      timestamp
      funding
    }
    # latest update
    latest: fundingRateUpdates(
      first: 1
      where: { market: $market }
      orderBy: sequenceLength
      orderDirection: desc
    ) {
      timestamp
      funding
    }
  }					
`

export const getLyraMarkets = async () => {
  try {
    const { data } = await client.query({ query: gql(getAverageFundingRateForMarkets) });
    return data; 
  } catch (error) {
    console.log('Error fetching data: ', error)
  }
}