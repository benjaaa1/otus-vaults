import React from "react";

import { Flex, Stack, Box, Text } from '@chakra-ui/react'
import { Slider } from "../../_Common/Slider";
import { useCreateVaultContext } from "../../../context/CreateVaultContext";

const ReviewStep = () => {

  const { state, updateVaultStrategy } = useCreateVaultContext(); 
  
  const { vaultStrategy } = state; 

  const {
    collatBuffer, 
    collatPercent,
    minTimeToExpiry,
    maxTimeToExpiry,
    minTradeInterval,
    gwavPeriod,
  } = vaultStrategy; 

  return (
      <Box  p={'6'}>

        <Stack spacing={6}>
          
        <Flex>
          <Box flex='1'>
            <Text fontSize='sm'>Vault Information</Text>
          </Box>
        </Flex>

        <Flex>
          <Box flex='1'>
            <Text fontSize='sm'>Vault Settings</Text>
          </Box>
        </Flex>
        
        <Flex>
          <Box flex='1'>
            <Text fontSize='sm'>Strategy Settings</Text>
          </Box>
        </Flex>

        </Stack>

      </Box>
  )
}

export default ReviewStep;
