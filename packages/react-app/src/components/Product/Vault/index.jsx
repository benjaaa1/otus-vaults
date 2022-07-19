import { Flex, Box, HStack } from "@chakra-ui/react";
import React from "react";
import { useParams } from "react-router-dom";
import { BaseDepositBox, BaseShadowBox, BaseVaultBox, HeaderContainer, HeaderInternalContainer, PageContainer } from "../../Common/Container";
import { StrategyVault } from "./StrategyVault";
import { Performance } from "./Performance";
import { Risks } from "./Risks";
import { Transactions } from "./Transactions";
import { UserActions } from "./UserActions";
import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../designSystem/colors";
import theme from "../../../designSystem/theme";
import { BaseHeaderText } from "../../../designSystem";
import { CTAButton } from "../../Common/Button";

export const Vault = () => {

  return (
    <>
    <HeaderContainer mt={'40px'} mb={'40px'} pb={'40px'}>
      <HeaderInternalContainer>
        <HStack spacing={6}>
          <Box flex={1}>
            <Box>
              <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                Vault & Strategy Manager
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
      <BaseVaultBox flex="2" p="4" mt="4" minHeight={'600px'}>

        <Tabs isFitted>
          <TabList mb='2em'>
            <Tab color={colors.text.dark} sx={{ fontWeight: '700', fontFamily: theme.font.header, textDecoration: 'none' }}>Strategy</Tab>
            <Tab color={colors.text.dark} sx={{ fontWeight: '700', fontFamily: theme.font.header, textDecoration: 'none' }}>Performance</Tab>
            <Tab color={colors.text.dark} sx={{ fontWeight: '700', fontFamily: theme.font.header, textDecoration: 'none' }}>Transaction</Tab>
            <Tab color={colors.text.dark} sx={{ fontWeight: '700', fontFamily: theme.font.header, textDecoration: 'none' }}>Risks</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <StrategyVault />
            </TabPanel>
            <TabPanel>
              <Performance />
            </TabPanel>
            <TabPanel>
              <Transactions />
            </TabPanel>
            <TabPanel>
              <Risks />
            </TabPanel>
          </TabPanels>
        </Tabs>

      </BaseVaultBox>
      <BaseDepositBox flex="1" p="4" mt="4" ml="4" height={'400px'}>
        <UserActions />
      </BaseDepositBox>
    </Flex>
    </PageContainer>
    </>
  );
}
