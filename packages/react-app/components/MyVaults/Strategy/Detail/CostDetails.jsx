import React from "react";

import { 
  Box,
  Center,
  Flex,
  HStack,
  Text,
  Input,
  VStack,
  StackDivider,
  Spacer
} from '@chakra-ui/react';

import { useStrategyContext } from "../../../../context/StrategyContext";
import colors from "../../../../designSystem/colors";

export const CostDetails = ({ transactionData }) => {

  const { 
    strategyValue
  } = useStrategyContext();

  const { vaultState } = strategyValue; 

  return <Box  borderTop={'1px solid #333'} p={'4'}>
      
      <Flex minWidth='max-content' alignItems={'center'} justifyContent={'space-between'}>

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Sans', monospace`}>
            Min Received
          </Text>
        </Box>

        <Spacer />

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
            ${ transactionData.minReceived }
          </Text>
        </Box>

      </Flex>

      <Flex minWidth='max-content' alignItems={'center'} justifyContent={'space-between'}>

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Sans', monospace`}>
            Max Cost 
          </Text>
        </Box>

        <Spacer />

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
            ${
              transactionData.maxCost
            }
          </Text>
        </Box>

      </Flex>

      
      <Flex minWidth='max-content' alignItems={'center'} justifyContent={'space-between'}>

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Sans', monospace`}>
            Vault Funds Locked
          </Text>
        </Box>

        <Spacer />

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
            ${
              vaultState.lockedAmount
            }
          </Text>
        </Box>

      </Flex>

      <Flex minWidth='max-content' alignItems={'center'} justifyContent={'space-between'}>

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Sans', monospace`}>
            Capital Used
          </Text>
        </Box>

        <Spacer />

        <Box flex={'1'}>
          <Text fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
            ${
              vaultState.lockedAmount - vaultState.lockedAmountLeft
            }
          </Text>
        </Box>

      </Flex>

  </Box>
}