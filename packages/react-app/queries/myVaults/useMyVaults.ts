import { useQuery } from 'react-query';
import request, { gql } from 'graphql-request';
import { getOtusEndpoint } from '../utils';
import { useWeb3Context } from '../../context';
import QUERY_KEYS from '../../constants/queryKeys';
import { BigNumberish } from 'ethers';

export type Vault = {
  id: string; 
  manager: string; 
  round: number; 
  isActive: boolean; 
  isPublic: boolean; 
  strategy: string;
  name: string; 
  description: string; 
  performanceFee: BigNumberish;
  managementFee: BigNumberish;
  asset: string; 
  vaultCap: BigNumberish; 
}

type ManagerVault  = {
	vaults?: Vault[];
  isLoading: boolean; 
  isSuccess: boolean; 
}

export const useMyVaults = () => {

  const { address: managerId,  network } = useWeb3Context()

	const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<ManagerVault>(
    QUERY_KEYS.Vaults.ManagerVaults(managerId?.toLowerCase()),
    async () => {
      if (!managerId) return null;
      console.log({ managerId })
      const response = await request(
        otusEndpoint,
        gql`
        query($managerId: String!) {
          vaults( where: { manager: $managerId } ) {
            id, 
            manager, 
            round,
            isActive,
            isPublic,
            strategy,
            name,
            description,
            performanceFee,
            managementFee,
            asset,
            vaultCap
          },
        }
        `,
        { managerId: managerId.toLowerCase() }
      );
      console.log({ response })
      return response ? response : null;
    },
    {
      enabled: !!managerId,
    }
  );
}

export const useMyVault = (vaultId: any) => {

  const { address: managerId,  network } = useWeb3Context()

	const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<Vault>(
    QUERY_KEYS.Vaults.ManageMyVault(managerId?.toLowerCase(), vaultId?.toLowerCase()),
    async () => {
      if (!managerId) return null;
      console.log({ managerId })
      const response = await request(
        otusEndpoint,
        gql`
        query($managerId: String!, $vaultId: String!) {
          vaults( where: { manager: $managerId, id: $vaultId } ) {
            id, 
            round,
            isActive,
            isPublic,
            strategy,
            name,
            description,
            performanceFee,
            managementFee,
            asset,
            vaultCap
          },
        }
        `,
        { managerId: managerId?.toLowerCase(), vaultId: vaultId?.toLowerCase() }
      );
      console.log({ response })
      return response.vaults.length > 0 ? response.vaults[0] : null;
    },
    {
      enabled: !!managerId && !!vaultId,
    }
  );
}