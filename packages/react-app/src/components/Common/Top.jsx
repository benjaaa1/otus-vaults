import React from "react";
import { Flex, Box } from 'reflexbox';
import { Account } from "../utils";
import Link from "./Link";
import styled from "styled-components";
import colors from "../../designSystem/colors";

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
    <Flex bg={colors.background.one}>
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
            <Link to="/">Products</Link>
          </MenuItem>
          <MenuItem>
            <Link to="/portfolio">Portfolio</Link>
          </MenuItem>
          <MenuItem>
            <Link to="/supervisors">Supervisors</Link>
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
  )
}