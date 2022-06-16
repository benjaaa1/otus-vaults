import React from "react";
import { Flex, Box, HStack, Spacer, Text } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import { NavContainer } from "./Container";

export const Top = () => {
  return (
    <NavContainer>
      <Flex minWidth='max-content' alignItems={'center'} justifyContent={'space-between'}>
        <HStack width={'100%'}>

          <Box flex='1' p='2'>
            Otus Finance
          </Box>

          <Spacer />

          <Box flex='1' p='2' minWidth='max-content' alignItems='center'>
            <HStack
              as={'nav'}
              spacing={6}
              display={{ base: 'none', md: 'flex' }}
            >
              <NavigationLink to="/">Products</NavigationLink>
              <NavigationLink to="/portfolio">Portfolio</NavigationLink>
              <NavigationLink to="/my-vaults">My Vaults</NavigationLink>
            </HStack>
          </Box>

          <Spacer />

          <Box flex='1' p='2' alignContent={'end'}>
            <Account />
          </Box >

        </HStack>

      </Flex>
    </NavContainer>

  )
}