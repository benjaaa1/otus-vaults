import React from "react";
import { Route, Switch, useHistory } from "react-router-dom";
import useSupervisor from "../../hooks/useSupervisor";

import SupervisorFlow from "./Flow/SupervisorFlow";
import VaultFlow from "./Flow/VaultFlow";
import Strategy from "./Strategy";
import { PageContainer } from "../Common/Container";
import { Center, Spinner } from '@chakra-ui/react'

const Supervisor = () => {

  const { loading } = useSupervisor();
  
  return (
    <PageContainer>
      {
        loading ? 
          <Center>
            <Spinner />
          </Center> :
          <Switch>
          <Route path={"/supervisors/flow"}>
            <SupervisorFlow />
          </Route>
          <Route path={"/supervisors/vault_flow"}>
            <VaultFlow /> 
          </Route>
          <Route path={"/supervisors/:vault/:strategy"}>
            <Strategy /> 
          </Route>
        </Switch> 
      }

    </PageContainer>
  );
}

export default Supervisor;
