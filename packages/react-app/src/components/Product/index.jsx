import React, { useEffect, useState } from "react";
import { Vaults } from "./Vaults"; 
import { useContractLoader } from "eth-hooks";
import { HeaderContainer, PageContainer } from "../Common/Container";
import { BaseHeaderText, BaseText } from "../../designSystem";
import { useHistory } from "react-router-dom";
import { Flex, Box, Center, VStack } from '@chakra-ui/react';
import { CTAButton } from "../Common/Button";
import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";

const Product = ({ signer, contractConfig, chainId  }) => {
  console.log({ chainId });
  const history = useHistory(); 

  const [vaults, setVaults] = useState([]); 

  const contracts = useContractLoader(signer, contractConfig, chainId);

  const contract = contracts ? contracts['OtusCloneFactory'] : "";

  useEffect(async () => {
    if(contract) {
      try {
        const _vaults = await contract.getActiveVaults();  
        setVaults(_vaults);  
      } catch (error) {
        console.log({ error })
      }
    }
  }, [contract])

  return <PageContainer>
      <HeaderContainer p="10">
        <VStack spacing={2}>
          <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.md}>
            Join one of the many vaults or create your own and implement your own strategy, have your community join your vault and earn performance and management fees. 
          </BaseHeaderText>
          <CTAButton onClick={() => history.push("/supervisors")}>
            Become a Supervisor
          </CTAButton>
        </VStack>
      </HeaderContainer>
      <Vaults vaults={vaults} signer={signer} contractConfig={contractConfig} chainId={chainId} />
    </PageContainer>
  
}

export default Product;
