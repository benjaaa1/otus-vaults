import React, { useEffect, useState } from "react";
import { useContractLoader } from "eth-hooks";
import StrategyDetail from "./StrategyDetail";
import VaultDetail from "./VaultDetail";
import { Flex, Box } from 'reflexbox';
import { useHistory, useParams } from "react-router-dom";

export default function Strategy({ contract, signer, contractConfig, chainId }) {

  const { vault } = useParams();
  console.log({ contract, vault }); 

  const contracts = useContractLoader(signer, { ...contractConfig, customAddresses: { OtusVault: vault } }, chainId);

  const otusVault = contracts ? contracts['OtusVault'] : "";
  console.log({ otusVault }); 
  const [strategyAddress, setStrategyAddress] = useState(''); 
  console.log({ strategyAddress })
  useEffect(async () => {
    if(contract) {
      try {
        const strategy = await contract._getStrategy(vault); 
        console.log({ strategy })
        setStrategyAddress(strategy); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [contract])

  return (
    <Flex>
      <Box
        width={1/2}
        color='white'>
        <VaultDetail otusVault={otusVault} signer={signer} />
      </Box>
      <Box
        width={1/2}
        color='white'>
          {
            strategyAddress ? 
            <StrategyDetail 
              strategyAddress={strategyAddress}  
              signer={signer} 
              contractConfig={contractConfig} 
              chainId={chainId} 
            /> : 
            null 
          }
      </Box>
    </Flex>
  );

}
