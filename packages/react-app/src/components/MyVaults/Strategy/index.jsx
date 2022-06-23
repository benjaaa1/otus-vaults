import React, { useEffect, useState } from "react";

import { Flex, Box, Center, Spinner } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { StrategyBox, VaultStrategyBox } from "../../Common/Container";
import { StrategyProvider } from "../../../context/StrategyContext";
import { CTAButton } from "../../Common/Button";
import colors from "../../../designSystem/colors";

export default function Strategy() {

  return (
    <Flex>
      <StrategyProvider>

        {/* if in round 0 and active board is 0 dont show this
        if round > 0 and active board id with active expiry  */}
        <Box flex="1" p="4" mt="4" height={'200px'}>
          <CTAButton bg={colors.background.three} color={colors.text.dark} mb={2} fontSize={'sm'} fontWeight={'400'}>
            Active Round
          </CTAButton>
          <CTAButton bg={colors.background.one} fontSize={'sm'} fontWeight={'400'}>
            Upcoming Round
          </CTAButton>
        </Box>

        <StrategyBox flex="7" p="4" mt="4" minHeight={'600px'}>
          <StrategyDetail />
        </StrategyBox>

        <Box flex="3" p="4" mt="4" ml="4" height={'600px'}>
          <VaultDetail />
        </Box>

      </StrategyProvider>
    </Flex>
  );

}
