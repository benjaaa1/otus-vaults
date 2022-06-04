import React from "react";
import { Flex, Box, HStack, Spacer } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import { NavContainer } from "./Container";

export const Top = () => {
  return (
    <NavContainer>
      <Flex minWidth='max-content' alignItems='center' p={'2'}>
        <Box p='2'>
          Otus Finance
        </Box>
        <Spacer />
        <Box flex='1' p='2' minWidth='max-content' alignItems='center'>
          <HStack>
            <Box flex='1' m='2'>
              <NavigationLink to="/">Products</NavigationLink>
            </Box >
            <Spacer />
            <Box flex='1' m='2'>
              <NavigationLink to="/portfolio">Portfolio</NavigationLink>
            </Box>
            <Spacer />
            <Box flex='1' m='2'>
              <NavigationLink to="/supervisors">Supervisors</NavigationLink>
            </Box>
          </HStack>
        </Box>
        <Spacer />
        <Box p='2'>
          <Account />
        </Box >
      </Flex>
    </NavContainer>
  )
}