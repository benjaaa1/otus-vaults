import React from "react";
import { Flex, Box, HStack } from '@chakra-ui/react';
import { FooterNavContainer, NavContainer } from "./Container";
import { NavLink } from "react-router-dom";

export const Footer = () => {

  let activeStyle = {
    fontWeight: '700',
  };

  let style = {
    fontWeight: '400',
    fontFamily: `'IBM Plex Sans', sans-serif`,
    textDecoration: 'none',
  }

  return (
    <FooterNavContainer>

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

    </FooterNavContainer>

  )
}