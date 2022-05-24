import React from "react";
import { Flex, Box, HStack } from '@chakra-ui/react';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import styled from "styled-components";
import colors from "../../designSystem/colors";
import { NavContainer } from "./Container";
import theme from "../../designSystem/theme";

const MenuItem = styled(Box)`
  margin: 14px; 
`;

export const Top = ({
  address,
  localProvider,
  userSigner,
  mainnetProvider,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer
}) => {
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
          <Account
            address={address}
            localProvider={localProvider}
            mainnetProvider={mainnetProvider}
            userSigner={userSigner}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
          />
        </Box >
      </Flex>
    </NavContainer>
  )
}