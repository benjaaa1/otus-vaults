import request, { gql } from 'graphql-request'
import { useQuery } from "react-query"
import QUERY_KEYS from "../../constants/queryKeys"
import { useWeb3Context } from "../../context"
import { Manager } from "../../utils/types/manager"
import { getOtusEndpoint } from "../utils"

export const useManager = (managerId: any) => {

  const { network } = useWeb3Context()

  const otusEndpoint = getOtusEndpoint(network)

  return useQuery<Manager>(
    QUERY_KEYS.Vaults.ManagerVaults(managerId?.toLowerCase()),
    async () => {
      if (!managerId) return null
      const response = await request(
        otusEndpoint,
        gql`
          query ($managerId: String!) {
            manager(where: { id: $managerId }) {
              id
              twitter
              vaults
              managerActions
            }
          }
        `,
        { managerId: managerId.toLowerCase() }
      )
      return response ? response : null
    },
    {
      enabled: !!managerId,
    }
  )

}

export const useManagers = () => { }