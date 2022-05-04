import React, { useState } from "react";
import { Button } from "../../Common/Button"; 
import { useHistory } from "react-router-dom";

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
    <Button onClick={createSupervisor}>
      Create Supervisor
    </Button> 
  )
}

export default SupervisorFlow;
