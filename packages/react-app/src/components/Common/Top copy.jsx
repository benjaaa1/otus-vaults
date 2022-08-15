import React from "react";
import { Flex, Box, HStack, Spacer, Text } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavContainer, NavInternalContainer } from "./Container";
import { useNavigate, NavLink } from "react-router-dom";

export const Top = () => {
  let navigate = useNavigate();

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
            
            <Text fontFamily={ `'IBM Plex Sans', sans-serif`} cursor={'pointer'} p={2} onClick={() => navigate('/')} fontWeight={'700'}>Otus Finance</Text>

          </Box>

          <Spacer />

          <Box flex='1' p='2' minWidth='max-content' alignItems='center'>
            <HStack
              as={'nav'}
              spacing={6}
              display={{ md: 'flex' }}
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

          <Box flex='1' p='2' minWidth='max-content' alignItems='center'>
          <HStack
              display={{ md: 'flex' }}
            >
            <Account />
          </HStack>
          </Box >

        </HStack>

      </Flex>
      </NavInternalContainer>
    </NavContainer>

  )
}