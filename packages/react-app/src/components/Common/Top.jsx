import React from "react";
import styled from "styled-components";
import { Flex, Box, HStack } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import { NavContainer } from "./Container";

const MenuItem = styled(Box)`
  margin: 14px; 
`;

export const Top = () => {
  return (
    <NavContainer>
      <Flex minWidth='max-content' alignItems='center' gap='2'>
        <Box flex='1' p='2'>
          Otus Finance
        </Box>
        <Box flex='1' p='2' minWidth='max-content' alignItems='center'>
          <HStack>
            <MenuItem flex='1'>
              <NavigationLink to="/">Products</NavigationLink>
            </MenuItem >
            <MenuItem flex='1'>
              <NavigationLink to="/portfolio">Portfolio</NavigationLink>
            </MenuItem>
            <MenuItem flex='1'>
              <NavigationLink to="/supervisors">Supervisors</NavigationLink>
            </MenuItem>
          </HStack>
        </Box>
        <Box flex='1' p='2'>
          <Account />
        </Box >
      </Flex>
    </NavContainer>
  )
}