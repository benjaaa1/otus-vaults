import React from "react";
import { Flex, Box } from 'reflexbox';
import { Account } from "../utils";
import { NavigationLink } from "./Link";
import styled from "styled-components";
import colors from "../../designSystem/colors";
import { NavContainer } from "./Container";
import theme from "../../designSystem/theme";

const MenuItem = styled.div`
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
      <Flex p={theme.padding.md}>
        <Box
          width={1/4}
          color='white'>
          Otus Finance
        </Box>
        <Flex
          justifyContent="center"
          width={2/4}
          color='white'>
            <MenuItem>
              <NavigationLink to="/">Products</NavigationLink>
            </MenuItem>
            <MenuItem>
              <NavigationLink to="/portfolio">Portfolio</NavigationLink>
            </MenuItem>
            <MenuItem>
              <NavigationLink to="/supervisors">Supervisors</NavigationLink>
            </MenuItem>
        </Flex>
        <Box
          width={1/4}
          color='white'>
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
        </Box>
      </Flex>
    </NavContainer>
  )
}