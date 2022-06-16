import React, { useEffect, useState } from "react";

import { Flex, Box, Center, Spinner } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { StrategyBox, VaultStrategyBox } from "../../Common/Container";
import { StrategyProvider } from "../../../context/StrategyContext";

export default function Strategy() {

  return (
    <Flex>
      <StrategyProvider>
        <StrategyBox flex="4" p="4" mt="4" minHeight={'600px'}>
          <StrategyDetail />
        </StrategyBox>
        <Box flex="1" p="4" mt="4" ml="4" height={'600px'}>
          <VaultDetail />
        </Box>
      </StrategyProvider>
    </Flex>
  );

}
