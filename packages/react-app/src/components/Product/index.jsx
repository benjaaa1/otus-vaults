import React, { useEffect, useState } from "react";
import useWeb3 from "../../hooks/useWeb3";

import {
  VStack,
  useDisclosure,
} from '@chakra-ui/react';

import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";
import { HeaderContainer, PageContainer } from "../Common/Container";
import { BaseHeaderText } from "../../designSystem";
import { CTAButton } from "../Common/Button";
import { Vaults } from "./Vaults"; 
import { CreateVaultModal } from "../MyVaults/Flow/CreateModal";

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

  return <>
      <HeaderContainer p="10">
        <VStack spacing={2}>
          <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.md}>
            Join one of the many vaults or create your own and implement your own strategy, have your community join your vault and earn performance and management fees. 
          </BaseHeaderText>
          <CTAButton bg={colors.background.three} onClick={onOpen}>
            Create a Vault
          </CTAButton>
        </VStack>
      </HeaderContainer>
      <Vaults vaults={vaults} />

      <CreateVaultModal isOpen={isOpen} onClose={onClose} />
    </>
  
}

export default Product;
