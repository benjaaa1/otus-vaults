import React from "react";
import { Flex, Box, HStack, Spacer, Text, textDecoration } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import { NavContainer, NavInternalContainer } from "./Container";
import { NavLink } from "react-router-dom";
import { useNonce } from "eth-hooks";

export const Top = () => {

  let activeStyle = {
    fontWeight: '700',
  };

  let style = {
    fontWeight: '400',
    fontFamily: `'IBM Plex Sans', sans-serif`,
    textDecoration: 'none',
  }

  return (
    <NavContainer>
      <NavInternalContainer>
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
              <NavLink
                to="/"
                style={({ isActive }) =>
                  isActive ? activeStyle : style
                }
              >
                Products
              </NavLink>

              <NavLink
                to="/portfolio"
                style={({ isActive }) =>
                  isActive ? activeStyle : style
                }
              >
                Portfolio
              </NavLink>

              <NavLink
                to="/my-vaults"
                style={({ isActive }) =>
                  isActive ? activeStyle : style
                }
              >
                My Vaults
              </NavLink>

            </HStack>
          </Box>

          <Spacer />

          <Box flex='1' p='2' alignContent={'end'}>
            <Account />
          </Box >

        </HStack>

      </Flex>
      </NavInternalContainer>
    </NavContainer>

  )
}