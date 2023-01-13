import request, { gql } from 'graphql-request'
import { useQuery } from "react-query"
import QUERY_KEYS from "../../constants/queryKeys"
import { useWeb3Context } from "../../context"
import { Manager } from "../../utils/types/manager"
import { getOtusEndpoint } from "../utils"

export const useManager = (id: any) => {
  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network)
  console.log('managerId', id, otusEndpoint)

  return useQuery<Manager>(
    QUERY_KEYS.Vaults.ManagerVaults(id?.toLowerCase()),
    async () => {
      if (!id) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($id: String!) {
            managers(where: { id: $id }) {
              id
              twitter
            }
          }
        `,
        { id: id.toLowerCase() }
      )
      console.log({ response })
      return response ? response : null
    },
    {
      enabled: !!id,
    }
  )

}

export const useManagers = () => { }