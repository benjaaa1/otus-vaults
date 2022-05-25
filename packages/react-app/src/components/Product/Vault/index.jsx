import { Flex, Box } from "@chakra-ui/react";
import React from "react";
import { useParams } from "react-router-dom";
import { BaseDepositBox, BaseShadowBox, BaseVaultBox } from "../../Common/Container";
import { Strategy } from "./Strategy";
import { Performance } from "./Performance";
import { Risks } from "./Risks";
import { Transactions } from "./Transactions";
import { UserActions } from "./UserActions";
import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../designSystem/colors";
import theme from "../../../designSystem/theme";

export const Vault = () => {

  return (
    <Flex>
      <BaseVaultBox flex="2" p="4" mt="4" minHeight={'600px'}>

          <Tabs isFitted variant='enclosed'>
            <TabList mb='2em'>
              <Tab color={colors.text.dark} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Strategy</Tab>
              <Tab color={colors.text.dark} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Performance</Tab>
              <Tab color={colors.text.dark} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Transaction</Tab>
              <Tab color={colors.text.dark} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Risks</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Strategy />
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
  );
}
