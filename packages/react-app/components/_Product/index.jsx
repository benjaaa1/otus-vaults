import React, { useRef,  useEffect, useState } from "react";
import useWeb3 from "../../hooks/useWeb3";

import {
  VStack,
  Box,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';

import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";
import { HeaderContainer, HeaderInternalContainer, PageContainer } from "../_Common/Container";
import { BaseHeaderText } from "../../designSystem";
import { CTAButton } from "../_Common/Button";
import { Vaults } from "./Vaults"; 
import { CreateVaultModal } from "../_MyVaults/Flow/CreateModal";

const Product = () => {

  const { isOpen, onOpen, onClose } = useDisclosure()

  const [vaults, setVaults] = useState([]); 

  const { contracts } = useWeb3({});

  const otusController = contracts ? contracts['OtusController'] : "";
  console.log({ otusController })
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

  const myRef = useRef(null)

  const executeScroll = () => myRef.current.scrollIntoView()    

  return <>
      <HeaderContainer>
        <HeaderInternalContainer>
          <HStack spacing={6}>
            <Box flex={1}>
              <Box>
                <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                  Earn with managed vaults, choose by asset or by historical performance.
                </BaseHeaderText>
              </Box>
              <Box mt={'18'}>
                <CTAButton bg={colors.background.two} color={colors.text.light} onClick={executeScroll}>
                  View Vaults
                </CTAButton>
              </Box>
            </Box>
            <Box flex={1}>
              <Box>
                <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                  Build and Manage your own permissionless options vault for any asset. 
                </BaseHeaderText>
              </Box>
              <Box mt={'18'}>
                <CTAButton bg={colors.background.three} onClick={onOpen}>
                  Create a Vault
                </CTAButton>
              </Box>
            </Box>
          </HStack>
        </HeaderInternalContainer>
      </HeaderContainer>
      <PageContainer ref={myRef}>
     
        <Vaults vaults={vaults} />

      </PageContainer>

      <CreateVaultModal isOpen={isOpen} onClose={onClose} />
    </>
  
}

export default Product;
