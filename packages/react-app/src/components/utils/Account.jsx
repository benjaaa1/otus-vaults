
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
import useWeb3 from "../../hooks/useWeb3";
import { ALCHEMY_KEY, INFURA_ID } from "../../constants";
import { useStaticJsonRPC } from "../../hooks";

// const providers = [
//   `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
// ];

const providers =[`https://optimism-kovan.infura.io/v3/${INFURA_ID}`];


export default function Account() {

  const mainnetProvider = useStaticJsonRPC(providers);
  
  const { address, web3CachedProvider, loadWeb3Modal, logoutOfWeb3Modal, blockExplorer } = useWeb3({}); 

  const ens = useLookupAddress(mainnetProvider, address);
  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
  const etherscanLink = `${blockExplorer || "https://etherscan.io/"}address/${address}`;
  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);

  if (validEnsCheck) {
    displayAddress = ens;
  } 

  return !address ?
        <Button bg={'#333'} color={'#ffffff'} onClick={() => loadWeb3Modal()} rightIcon={<ChevronRightIcon />}>
          Connect
        </Button> :
        <Menu>
          <MenuButton bg={'#333'} color={'#ffffff'} as={Button} rightIcon={<ChevronDownIcon />}>
            {displayAddress}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => window.location.href=`${etherscanLink}`}>View on Etherscan</MenuItem>
            <MenuItem onClick={() => logoutOfWeb3Modal()}>
              {
                web3CachedProvider ? 'Disconnect' : null
              }
            </MenuItem>
          </MenuList>
        </Menu>
}
