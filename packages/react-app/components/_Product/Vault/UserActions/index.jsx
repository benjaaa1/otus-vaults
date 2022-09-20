import React from "react";

import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../../designSystem/colors";
import theme from "../../../../designSystem/theme";
import { Deposit } from "./Deposit";
import { Withdraw } from "./Withdraw";

export const UserActions = () => {

  return (
    <Tabs isFitted>
      <TabList mb='2em'>
        <Tab variantColor="red" color={colors.text.light} sx={{ fontSize: 'sm', fontFamily: theme.font.sans, textDecoration: 'none', fontWeight: '700' }}>Deposit</Tab>
        <Tab color={colors.text.light} sx={{  fontSize: 'sm',  fontFamily: theme.font.sans, textDecoration: 'none', fontWeight: '700' }}>Withdraw</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Deposit />
        </TabPanel>
        <TabPanel>
          <Withdraw />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}