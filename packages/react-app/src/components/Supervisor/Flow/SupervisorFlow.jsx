import React, { useState } from "react";
import { Button } from "../../Common/Button"; 
import { useHistory } from "react-router-dom";
import { Flex, Box } from 'reflexbox';
import { BaseShadowBox } from "../../Common/Container";

const SupervisorFlow = ({ contract, signer }) => {

  const history = useHistory();

  const [supervisor, setSupervisor] = useState(); 

  const createSupervisor = async () => {
    try {
      const response = await contract.connect(signer).cloneSupervisor(); 
      console.log({ response }); 
      history.push(`/supervisors/vault_flow`);

      setSupervisor(response); 
    } catch (e) {
      console.log(e); 
    }
  };

  return (
    <BaseShadowBox padding={0}>
      <Button onClick={createSupervisor}>
        Create Supervisor
      </Button> 
    </BaseShadowBox>
  )
}

export default SupervisorFlow;
