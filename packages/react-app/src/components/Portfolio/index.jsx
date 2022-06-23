import React, { useEffect, useState } from "react";
import useWeb3 from "../../hooks/useWeb3";

import {
  VStack,
  Text,
  useDisclosure,
  StackDivider,
  Box,
} from '@chakra-ui/react';

import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";
import { HeaderContainer, PageContainer } from "../Common/Container";
import { BaseHeaderText } from "../../designSystem";

import { Contract, Provider } from 'ethers-multicall';
import deployedContracts from "../../contracts/hardhat_contracts.json";
import { INFURA_ID } from "../../constants";
import { ethers } from "ethers";

const Portfolio = () => {

  const provider = new ethers.providers.InfuraProvider('optimism-kovan', INFURA_ID);
  const ethcallProvider = new Provider(provider);
  const {address, chainId,  signer} = useWeb3({});

  const [vaults, setVaults] = useState([]); 

  const { contracts } = useWeb3({});

  const otusController = contracts ? contracts['OtusController'] : "";

  const [OtusVaultABI, setOtusVaultABI] = useState(null); 

  useEffect(() => {
    console.log({ chainId})
    if(chainId != null && deployedContracts != undefined) {
      setOtusVaultABI(deployedContracts['69']['kovanOptimism'].OtusVault.abi)
    }
  }, [chainId, deployedContracts])

  useEffect(async () => {
    if(otusController) {
      try {
        const _vaults = await otusController.getActiveVaults();  
        setVaults(_vaults);  
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusController])

  useEffect(async () => {
    if(OtusVaultABI != null) {
      try {
        const vaultCalls = vaults.map(vault => {
          const otusVaultContract = new Contract(vault, OtusVaultABI);
          const call = otusVaultContract.depositReceipts(address);
          return call; 
        })
  
        const receipts = await ethcallProvider.all(vaultCalls); 
        console.log({ receipts })
      } catch (error) {
        console.log({ error })
      }
    }
  }, [OtusVaultABI, vaults])

  return <PageContainer>

      <VStack 
        spacing={4}
        align='stretch'
      >
        <Box p={4} bg={colors.background.two}>
          <Text textTransform={'uppercase'} color={colors.text.light} fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
          Portfolio Summary
          </Text>
        </Box>

        <Box p={4} textTransform={'uppercase'} bg={colors.background.two}>
          <Text color={colors.text.light} fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
          Positions
          </Text>
        </Box>

        <Box p={4} textTransform={'uppercase'} bg={colors.background.two}>
          <Text color={colors.text.light} fontSize={'sm'} fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>
          Transaction History
          </Text>
        </Box>
      </VStack>

    </PageContainer>
  
}

export default Portfolio;








