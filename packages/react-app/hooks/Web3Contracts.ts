import { useContractLoader, useUserProviderAndSigner } from "eth-hooks";
import externalContracts from "../contracts/external_contracts";
import deployedContracts from "../contracts/hardhat_contracts.json";
import { ethers } from 'ethers'

export const useContracts = (signer: ethers.providers.StaticJsonRpcProvider, network: ethers.providers.Network | null | undefined, customAddresses: Record<string, string>) => {

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };
  // need to update publish contract to remove chain id to match type
  const withCustomContractConfig: any = { ...contractConfig, customAddresses };
  const contracts = useContractLoader(signer, withCustomContractConfig, network?.chainId);
  return {
    contracts
  }
}