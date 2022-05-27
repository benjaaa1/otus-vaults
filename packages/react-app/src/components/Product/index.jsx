import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import useWeb3 from "../../hooks/useWeb3";

import { VStack } from '@chakra-ui/react';

import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";
import { HeaderContainer, PageContainer } from "../Common/Container";
import { BaseHeaderText } from "../../designSystem";
import { CTAButton } from "../Common/Button";
import { Vaults } from "./Vaults"; 

const Product = () => {

  const history = useHistory(); 
  const [vaults, setVaults] = useState([]); 

  const { contracts } = useWeb3({});

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  useEffect(async () => {
    if(otusCloneFactory) {
      try {
        const _vaults = await otusCloneFactory.getActiveVaults();  
        setVaults(_vaults);  
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusCloneFactory])

  return <PageContainer>
      <HeaderContainer p="10">
        <VStack spacing={2}>
          <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.md}>
            Join one of the many vaults or create your own and implement your own strategy, have your community join your vault and earn performance and management fees. 
          </BaseHeaderText>
          <CTAButton bg={colors.background.three} onClick={() => history.push("/supervisors")}>
            Become a Supervisor
          </CTAButton>
        </VStack>
      </HeaderContainer>
      <Vaults vaults={vaults} />
    </PageContainer>
  
}

export default Product;
