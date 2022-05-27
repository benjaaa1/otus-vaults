import { useEffect, useState } from "react";
import useInjectedProvider from "./useInjectedProvider";
import { useContractLoader, useUserProviderAndSigner } from "eth-hooks";
import useChainId from "./useChainId";
import useNetwork from "./useNetwork";
import externalContracts from "../contracts/external_contracts";
import deployedContracts from "../contracts/hardhat_contracts.json";
import useStaticJsonRPC from "./useStaticJsonRPC";

export default function useWeb3(customAddresses, customAddressesL1) {

  const[address, setAddress] = useState('');

  const [targetNetwork, blockExplorer] = useNetwork(); 

  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);

  const [injectedProvider, loadWeb3Modal, logoutOfWeb3Modal, web3CachedProvider] = useInjectedProvider(); 

  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, false);
  const signer = userProviderAndSigner.signer;
  
  const chainId = useChainId(signer); 

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  const contracts = useContractLoader(signer,{ ...contractConfig, customAddresses }, 69);

  const contractsL1 = useContractLoader(signer,{ ...contractConfig, customAddresses }, 42);

  useEffect(() => {
    async function getAddress() {
      if (signer) {
        const newAddress = await signer.getAddress();
        console.log({ newAddress })
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [signer]);


  return {
    address, 
    signer, 
    web3CachedProvider, 
    loadWeb3Modal, 
    logoutOfWeb3Modal, 
    contracts, 
    contractsL1,
    blockExplorer
  };

}
