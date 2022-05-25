import React, { useEffect, useState } from "react";
import { useContractLoader } from "eth-hooks";
import { ethers } from "ethers"; 

import { Route, Switch, useHistory } from "react-router-dom";
import SupervisorFlow from "./Flow/SupervisorFlow";
import VaultFlow from "./Flow/VaultFlow";
import Strategy from "./Strategy";
import { PageContainer } from "../Common/Container";
import { Flex, Box } from '@chakra-ui/react';
import useWeb3 from "../../hooks/useWeb3";

const Supervisor = () => {

  const history = useHistory();

  const { contracts, signer } = useWeb3({}); 

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  const [loading, setLoading] = useState(true); 
  const [userDetails, setUserDetails] = useState(); 

  useEffect(async () => {
    if(otusCloneFactory) {
      try {
        const details = await otusCloneFactory.connect(signer).getUserManagerDetails();  
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
  }, [otusCloneFactory])
  
  return (
    <PageContainer>
      
      <Switch>
        <Route path={"/supervisors/flow"}>
          <SupervisorFlow otusCloneFactory={otusCloneFactory} signer={signer} />
        </Route>
        <Route path={"/supervisors/vault_flow"}>
          <VaultFlow otusCloneFactory={otusCloneFactory} signer={signer} /> 
        </Route>
        <Route path={"/supervisors/:vault/:strategy"}>
          <Strategy otusCloneFactory={otusCloneFactory} /> 
        </Route>
      </Switch> 

    </PageContainer>
  );
}

export default Supervisor;
