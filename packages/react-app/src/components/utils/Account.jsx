
import React from "react";
import {
  Box, 
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'; 
import { useLookupAddress } from "eth-hooks/dapps/ens";
import { ChevronRightIcon, ChevronDownIcon } from "@chakra-ui/icons";

export default function Account({ address, mainnetProvider, blockExplorer, web3Modal, loadWeb3Modal, logoutOfWeb3Modal }) {

  const ens = useLookupAddress(mainnetProvider, address);
  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
  const etherscanLink = `${blockExplorer || "https://etherscan.io/"}address/${address}`;
  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);

  if (validEnsCheck) {
    displayAddress = ens;
  } 

  return <Box flex="1">
      {
        !address ?
        <Button onClick={() => loadWeb3Modal()} rightIcon={<ChevronRightIcon />}>
          Connect
        </Button> :
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            {displayAddress}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => window.location.href=`${etherscanLink}`}>View on Etherscan</MenuItem>
            <MenuItem onClick={() => logoutOfWeb3Modal()}>
              {
                web3Modal.cachedProvider ? 'Disconnect' : null
              }
            </MenuItem>
          </MenuList>
        </Menu>
      }
    </Box>
}
