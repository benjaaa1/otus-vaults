import React, { useEffect, useState } from "react";

import { Flex, Box, Center, Spinner } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { StrategyBox, VaultStrategyBox } from "../../Common/Container";
import useStrategy from "../../../hooks/useStrategy";
import { StrategyProvider } from "../../../context/StrategyContext";

export default function Strategy() {

  const { loading, strategyAddress } = useStrategy();

  return (
    <Flex>
      <StrategyProvider>
        <StrategyBox flex="4" p="4" mt="4" minHeight={'600px'}>
        {
          !loading && strategyAddress ? 
          <StrategyDetail /> : 
          <Center><Spinner /></Center> 
        }
        </StrategyBox>
        <VaultStrategyBox flex="1" p="4" mt="4" ml="4" height={'400px'}>
          <VaultDetail strategyAddress={strategyAddress} />
        </VaultStrategyBox>
      </StrategyProvider>
    </Flex>
  );

}
