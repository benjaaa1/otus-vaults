import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const APIURL = 'https://api.thegraph.com/subgraphs/name/paulvaden/lyra-kovan-3'

const client = new ApolloClient({
  uri: APIURL,
  cache: new InMemoryCache(),
})

const lyraMarketsQuery = `
  query {
    markets {
      id
      address
      name
      quoteAddress
      baseAddress
    }
  }  
`

export const getLyraMarkets = async () => {
  try {
    const { data } = await client.query({ query: gql(lyraMarketsQuery) });
    return data; 
  } catch (error) {
    console.log('Error fetching data: ', error)
  }
}