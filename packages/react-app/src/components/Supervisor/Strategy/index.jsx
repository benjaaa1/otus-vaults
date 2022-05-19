import React, { useEffect, useState } from "react";
import { useContractLoader } from "eth-hooks";
import StrategyDetail from "./StrategyDetail";
import VaultDetail from "./VaultDetail";
import { Flex, Box } from 'reflexbox';
import { useHistory, useParams } from "react-router-dom";
import { BaseShadowBox } from "../../Common/Container";

export default function Strategy({ contract, signer, contractConfig, chainId }) {

  const { vault } = useParams();

  const contracts = useContractLoader(signer, { ...contractConfig, customAddresses: { OtusVault: vault } }, chainId);

  const otusVault = contracts ? contracts['OtusVault'] : "";

  const [strategyAddress, setStrategyAddress] = useState(''); 

  useEffect(async () => {
    if(contract) {
      try {
        const strategy = await contract._getStrategy(vault); 
        setStrategyAddress(strategy); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [contract])

  return (
      <BaseShadowBox padding={0}>
        <Flex>
        <Box width={1/5} sx={{ borderRight: "2px solid #373737"}}>
          <VaultDetail otusVault={otusVault} signer={signer} />
        </Box>
        <Box width={4/5}>
            {
              strategyAddress ? 
              <StrategyDetail 
                otusVault={otusVault}
                strategyAddress={strategyAddress}  
                signer={signer} 
                contractConfig={contractConfig} 
                chainId={chainId} 
              /> : 
              null 
            }
        </Box>
        </Flex>
      </BaseShadowBox>

  );

}
