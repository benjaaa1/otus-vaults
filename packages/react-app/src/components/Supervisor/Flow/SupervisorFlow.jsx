import React, { useState } from "react";
import { Button } from "../../Common/Button"; 
import { useHistory } from "react-router-dom";
import { Stack, Center, Text, Heading, Box  } from '@chakra-ui/react';
import { BaseShadowBox } from "../../Common/Container";

const SupervisorFlow = ({ otusCloneFactory, signer }) => {

  const history = useHistory();

  const [supervisor, setSupervisor] = useState(); 

  const createSupervisor = async () => {
    try {
      const response = await otusCloneFactory.connect(signer).cloneSupervisor(); 
      console.log({ response }); 
      history.push(`/supervisors/vault_flow`);

      setSupervisor(response); 
    } catch (e) {
      console.log(e); 
    }
  };

  return (
    <Center>
      <Box w='474px'>
        <BaseShadowBox>
          <Box bgImage="url('https://bit.ly/2Z4KKcF')">
            <Heading>Become a Supervisor of your own Vault.</Heading>
          </Box>
          <Stack spacing={6}>
            <Text>
              Create your own vault for many different assets supported, implement your own advanced strategy, short strangles, iron condors, put sellings and any other custom stratregies supported by Otus Finance. 
            </Text>
            <Text>
              Have your community join your vault and earn performance and management fees. 
            </Text>
          </Stack>
          <Button onClick={createSupervisor}>
            Create Supervisor
          </Button> 
        </BaseShadowBox>
      </Box>
    </Center>
  )
}

export default SupervisorFlow;
