import React from "react";
import { Deposit } from "./Deposit";
import { Withdrawal } from "./Withdrawal";
import { useContractLoader } from "eth-hooks";
import { useParams } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../../designSystem/colors";
import theme from "../../../../designSystem/theme";

export const UserActions = () => {

  return (
    <Tabs isFitted variant='enclosed'>
      <TabList mb='2em'>
        <Tab color={colors.text.light} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Deposit</Tab>
        <Tab color={colors.text.light} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Withdrawal</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Deposit />
        </TabPanel>
        <TabPanel>
          <Withdrawal />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}