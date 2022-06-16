import React, { useState } from "react";
import useSupervisor from "../../../hooks/useSupervisor";

import { Stack, Center, Text, Heading, Box  } from '@chakra-ui/react';
import { NextButtonIcon } from "../../Common/Button"; 
import { BaseShadowBox } from "../../Common/Container";

const SupervisorFlow = () => {

  const { loading, createSupervisor } = useSupervisor();

  return (
    <Center>
      <Box w='474px' m="24">
        <BaseShadowBox>
          <Box bgImage="url('https://bit.ly/2Z4KKcF')">
            <Heading p={'6'} pt={'12'} as='h4'>Become a Supervisor of your own Vault.</Heading>
          </Box>
          <Box p={'6'}>
            <Stack spacing={6}>
              <Text fontSize='md' lineHeight={'xl'}>
                Create your own vault for many different assets supported, implement your own advanced strategy, short strangles, iron condors, put sellings and any other custom stratregies supported by Otus Finance. 
              </Text>
              <Text fontSize='md' lineHeight={'xl'}>
                Have your community join your vault and earn performance and management fees. 
              </Text>
              <NextButtonIcon isLoading={loading} onClick={createSupervisor} />
            </Stack>
          </Box>

        </BaseShadowBox>
      </Box>
    </Center>
  )
}

export default SupervisorFlow;
