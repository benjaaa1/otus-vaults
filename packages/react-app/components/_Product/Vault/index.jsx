import { Flex, Box, HStack } from "@chakra-ui/react";
import React from "react";
import { useParams } from "react-router-dom";
import { BaseDepositBox, BaseShadowBox, BaseVaultBox, HeaderContainer, HeaderInternalContainer, PageContainer } from "../../_Common/Container";
import { StrategyVault } from "./StrategyVault";
import { Performance } from "./Performance";
import { Risks } from "./Risks";
import { Transactions } from "./Transactions";
import { UserActions } from "./UserActions";
import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../designSystem/colors";
import theme from "../../../designSystem/theme";
import { BaseHeaderText, BaseVaultHeaderText } from "../../../designSystem";
import { CTAButton } from "../../_Common/Button";
import useVaultStrategyState from "../../../hooks/useVaultsStrategyState";

export const Vault = () => {
  
  const { vault } = useParams();

  const { vaultInfo, isLoadingVault } = useVaultStrategyState(vault); 
  console.log({ vaultInfo, isLoadingVault });

  const {
    tokenName, 
    tokenSymbol,  
    name,
    description, 
    isPublic,
    vaultState, 
    vaultParams, 
    strikes
  } = vaultInfo; 

  return (
    <>
    <HeaderContainer mt={'40px'} mb={'40px'} pb={'40px'}>
      <HeaderInternalContainer>
        <HStack spacing={6}>
          <Box flex={1}>
            <Box>
              <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                { name }
              </BaseHeaderText>
            </Box>
            <Box mt={6} as='button' borderRadius='2px' bg='purple' color='white' px={4} h={8} fontWeight={'700'}>
              ETH
            </Box>
            <Box>
              <BaseHeaderText color={colors.buttons.primary} fontWeight={'700'} size={theme.fontSize.lg} width="60%">
                { tokenName } - { tokenSymbol }
              </BaseHeaderText>
            </Box>
            <Box>
              <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.md} width="60%">
                { description }
              </BaseHeaderText>
            </Box>
            
          </Box>
          <Box flex={1}>
{/* 
            <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box>

            <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box>

            <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box> */}

          </Box>
        </HStack>
      </HeaderInternalContainer>
    </HeaderContainer>
    <PageContainer>
    <Flex>

      <Box flex='2'>

        <BaseVaultBox p="4" mt="4">
          <HStack spacing={6}>


              <Box flex={1}>
                <Box>
                  <BaseVaultHeaderText color={colors.buttons.primary} size={theme.fontSize.sm} width="60%">
                    Strategy
                  </BaseVaultHeaderText>
                </Box>
                
              </Box>


          </HStack>
        </BaseVaultBox>

        <BaseVaultBox p="4" mt="4">
          <HStack spacing={6}>

              <Box flex={1}>
                <Box>
                  <BaseVaultHeaderText color={colors.buttons.primary} size={theme.fontSize.sm} width="60%">
                    Performance
                  </BaseVaultHeaderText>
                </Box>
              </Box>

          </HStack>
        </BaseVaultBox>


        <BaseVaultBox p="4" mt="4">
          <HStack spacing={6}>

              <Box flex={1}>
                <Box>
                  <BaseVaultHeaderText color={colors.buttons.primary} size={theme.fontSize.sm} width="60%">
                    Transactions
                  </BaseVaultHeaderText>
                </Box>
              </Box>

          </HStack>
        </BaseVaultBox>

        <BaseVaultBox p="4" mt="4">
          <HStack spacing={6}>

              <Box flex={1}>
                <Box>
                  <BaseVaultHeaderText color={colors.buttons.primary} size={theme.fontSize.sm} width="60%">
                    Risks
                  </BaseVaultHeaderText>
                </Box>
              </Box>

          </HStack>
        </BaseVaultBox>

      </Box>

      <BaseDepositBox flex="1" p="4" mt="4" ml="4" height={'400px'}>
        <UserActions />
      </BaseDepositBox>
    </Flex>
    </PageContainer>
    </>
  );
}
