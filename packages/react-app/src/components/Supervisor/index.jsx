import React, { useEffect, useState } from "react";
import { useContractLoader } from "eth-hooks";
import { ethers } from "ethers"; 

import { Route, Switch, useHistory } from "react-router-dom";
import SupervisorFlow from "./Flow/SupervisorFlow";
import VaultFlow from "./Flow/VaultFlow";
import Strategy from "./Strategy";
import { PageContainer } from "../Common/Container";
import { Flex, Box } from '@chakra-ui/react';

const Supervisor = ({ name, signer, contractConfig, chainId }) => {

  const history = useHistory();

  const contracts = useContractLoader(signer, contractConfig, chainId);

  const contract = contracts ? contracts[name] : "";
  console.log('contract', contract)
  const [loading, setLoading] = useState(true); 
  const [userDetails, setUserDetails] = useState(); 

  useEffect(async () => {
    if(contract) {
      try {
        console.log("contract", contract);
        const details = await contract.connect(signer).getUserManagerDetails();  
        console.log({ details });
        setUserDetails(details); 
       
        if(
            details['userSupervisor'] != ethers.constants.AddressZero && 
            details['userVault'] != ethers.constants.AddressZero &&
            details['userStrategy'] != ethers.constants.AddressZero
          ) {
          history.push(`/supervisors/${details['userVault']}/${details['userStrategy']}`);
        }

        if(
            details['userSupervisor'] != ethers.constants.AddressZero && 
            details['userVault'] == ethers.constants.AddressZero &&
            details['userStrategy'] == ethers.constants.AddressZero
          ) {
          history.push(`/supervisors/vault_flow`);
        }

        if(
            details['userSupervisor'] == ethers.constants.AddressZero && 
            details['userVault'] == ethers.constants.AddressZero &&
            details['userStrategy'] == ethers.constants.AddressZero
          ) {
          history.push(`/supervisors/flow`);
        }

      } catch (e) {
        console.log(e);
      }
      setLoading(false); 
    }
  }, [contract])
  
  return (
    <PageContainer>
      
      <Switch>
        <Route path={"/supervisors/flow"}>
          <SupervisorFlow contract={contract} signer={signer} />
        </Route>
        <Route path={"/supervisors/vault_flow"}>
          <VaultFlow contract={contract} signer={signer} /> 
        </Route>
        <Route path={"/supervisors/:vault/:strategy"}>
          <Strategy contract={contract} signer={signer} contractConfig={contractConfig} chainId={chainId} /> 
        </Route>
      </Switch> 

    </PageContainer>
  );
}

export default Supervisor;
