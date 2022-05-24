import React from "react";
import { Deposit } from "./Deposit";
import { Withdrawal } from "./Withdrawal";
import { useContractLoader } from "eth-hooks";
import { useParams } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanels, TabPanel } from "@chakra-ui/react";
import colors from "../../../../designSystem/colors";
import theme from "../../../../designSystem/theme";

export const UserActions = ({ name, signer, address, provider, contractConfig, chainId }) => {
  console.log({ chainId, contractConfig })
  const { vault } = useParams();

  const contracts = useContractLoader(
    signer, 
    { 
      ...contractConfig, 
      customAddresses: { 
        OtusVault: vault,  
        L2DepositMover: "0xEB27E1c0a5107d8c231B9a742d77c5aa26aA8506"
      } 
    }, 
    chainId);

  const contractL1 = useContractLoader(
    signer, 
    { 
      ...contractConfig, 
    }, 
    42);

  const l2DepositMover = contracts ? contracts['L2DepositMover'] : "";
  const otusVaultContract = contracts ? contracts[name] : "";
  const susdContract = contracts ? contracts['SUSD'] : "";
  const usdcContract2 = contracts ? contracts['USDC'] : "";
  const usdcContract = contractL1 ? contractL1['USDC'] : "";
  const l1bridge = contractL1 ? contractL1['L1Bridge'] : "";

  return (
    <Tabs isFitted variant='enclosed'>
      <TabList mb='2em'>
        <Tab color={colors.text.light} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Deposit</Tab>
        <Tab color={colors.text.light} sx={{ textTransform: 'uppercase', fontFamily: theme.font.header, textDecoration: 'none' }}>Withdrawal</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Deposit 
            l2DepositMover={l2DepositMover} 
            usdcContract2 ={usdcContract2} 
            usdcContract={usdcContract} 
            l1bridge={l1bridge} 
            otusVaultContract={otusVaultContract} 
            susdContract={susdContract}
            address={address} 
            signer={signer} 
          />
        </TabPanel>
        <TabPanel>
          <Withdrawal 
            otusVaultContract={otusVaultContract} 
            susdContract={susdContract}  
            address={address} 
            signer={signer} 
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}