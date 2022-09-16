import React from "react";

import { 
  Box,
  Center,
  Flex,
  HStack,
  Text
} from '@chakra-ui/react';

import { useStrategyContext } from "../../../../context/StrategyContext";
import { RemoveButton } from "../../../Common/Button";
import colors from "../../../../designSystem/colors";

export const CollateralDetails = () => {

  const { 
    state, 
    dispatch
  } = useStrategyContext();

  const { currentStrikes } = state; 
  return (
    <>
    {/* {
      currentStrikes.filter(({ _strike }) => _strike != null).map(({_strike, optionType}, index) => {
        return <Flex borderBottom={'1px solid #333'} p='4'>

          <HStack spacing={8} direction='row'>

            <RemoveButton bg={colors.background.one} color={colors.text.dark} onClick={() => dispatch({ type: 'REMOVE_CURRENT_STRIKE', payload: index })} />
          
            <Text fontSize={'lg'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{buildOptionTypeMessage('eth', _strike.strikePrice, optionType)}</Text>

          </HStack>

        </Flex>
      })
    }       */}
    </>
  );
}