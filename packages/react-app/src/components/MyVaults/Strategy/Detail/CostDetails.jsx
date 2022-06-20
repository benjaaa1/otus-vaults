import React from "react";

import { 
  Box,
  Center,
  Flex,
  HStack,
  Text,
  Input,
  VStack,
  StackDivider
} from '@chakra-ui/react';

import { useStrategyContext } from "../../../../context/StrategyContext";
import colors from "../../../../designSystem/colors";

export const CostDetails = ({ transactionData }) => {

  const { 
    state, 
    dispatch
  } = useStrategyContext();

  return <Flex borderTop={'1px solid #333'} p='4'>

    <VStack
      divider={<StackDivider borderColor='gray.200' />}
      spacing={4}
      align='stretch'
    >
      <HStack w={'full'} spacing={8} direction='row'>
      
        <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Mono', monospace`}>
          Min Received
        </Text>

        <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Mono', monospace`}>
          ${ transactionData.minReceived }
        </Text>

      </HStack>

      <HStack  w={'full'} spacing={8} direction='row'>

        <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Mono', monospace`}>
          Max Cost 
        </Text>

        <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Mono', monospace`}>
          ${
            transactionData.maxCost
          }
        </Text>

      </HStack>

    </VStack>

  </Flex>
}