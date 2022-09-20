import React from "react";

import { 
  Box,
  Center,
  Flex,
  HStack,
  Text,
  Input
} from '@chakra-ui/react';

import { useStrategyContext } from "../../../../context/StrategyContext";
import { RemoveButton } from "../../../_Common/Button";
import colors from "../../../../designSystem/colors";

export const TradeDetails = () => {

  const { 
    state, 
    dispatch
  } = useStrategyContext();

  const { currentStrikes } = state; 
  console.log({ currentStrikes })
  return <Flex borderBottom={'1px solid #333'} p='4'>

    <HStack spacing={8} direction='row'>
    
      <Text fontSize={'sm'} fontWeight={'400'} fontFamily={`'IBM Plex Mono', monospace`}>
        Size
      </Text>

      <Input width={'100'} color={colors.text.dark} placeholder='Size' onChange={(event) => dispatch({ type: 'UPDATE_SIZE', payload: { size: event.target.value } })} />

    </HStack>

  </Flex>
}