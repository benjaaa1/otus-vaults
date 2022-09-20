import { useQuery } from 'react-query';
import request, { gql } from 'graphql-request';
import { getOtusEndpoint } from '../utils';
import { useWeb3Context } from '../../context';
import QUERY_KEYS from '../../constants/queryKeys';
import { BigNumberish } from 'ethers';

type Vault = {
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

type AllAvailableVaults = {
	vaults?: Vault[];
  isLoading: boolean; 
  isSuccess: boolean; 
};

export const useVaultProducts = () => {
  const { network } = useWeb3Context()

	const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);
  return useQuery<AllAvailableVaults | null>(
		QUERY_KEYS.Vaults.AllVaults(),
		async () => {
			try {
				const response = await request(
					otusEndpoint,
					gql`
					query AllAvailableVaults {
						vaults {
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
						}
					}
				`,
					{}
				);
        console.log({ response })
				return response ? response : null;
			} catch (e) {
				console.log(e);
				return null;
			}
		},
		{ enabled: true, staleTime: Infinity, cacheTime: Infinity /*isAppReady && isL2 && !!currencyKey, ...options*/ }
	); 

} 

export const useVaultProduct = (vaultId: any) => {

  const { network } = useWeb3Context()

	const otusEndpoint = getOtusEndpoint(network) // getOtusEndpoint(network);

  return useQuery<Vault>(
    QUERY_KEYS.Vaults.Vault(vaultId),
    async () => {
      if (!vaultId) return null;
      console.log({ vaultId })
      const response = await request(
        otusEndpoint,
        gql`
        query($vaultId: String!) {
          vaults( where: { id: $vaultId } ) {
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
            vaultCap,
            userActions {
              id
            }
          },
        }
        `,
        { vaultId: vaultId }
      );
      return response ? response : null;
    },
    {
      enabled: !!vaultId,
    }
  );
}
