import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Flex, Box } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { BaseShadowBox } from "../../Common/Container";

export default function Strategy({ otusCloneFactory }) {

  const { vault } = useParams();

  const [strategyAddress, setStrategyAddress] = useState(''); 

  useEffect(async () => {
    if(otusCloneFactory) {
      try {
        const strategy = await otusCloneFactory._getStrategy(vault); 
        setStrategyAddress(strategy); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusCloneFactory])

  return (
      <BaseShadowBox>
        <Flex>
        <Box flex="1" sx={{ borderRight: "2px solid #373737"}}>
          <VaultDetail strategyAddress={strategyAddress} />
        </Box>
        <Box flex="4">
            {
              strategyAddress ? 
              <StrategyDetail strategyAddress={strategyAddress} /> : 
              null 
            }
        </Box>
        </Flex>
      </BaseShadowBox>

  );

}
