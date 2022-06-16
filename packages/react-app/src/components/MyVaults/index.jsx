import React from "react";
import useSupervisor from "../../hooks/useSupervisor";

import { PageContainer } from "../Common/Container";
import { Grid, GridItem, Stack, Center, Flex, Spinner, Box, useDisclosure } from '@chakra-ui/react'
import { ViewButton, CTAButton } from "../Common/Button";
import { CreateVaultModal } from "./Flow/CreateModal";
import colors from "../../designSystem/colors";
import { Route, Switch } from "react-router-dom";
import { VaultSummary } from "../Product/Vaults";

const MyVaults = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { loading, userVaults, viewMyVault } = useSupervisor();
  console.log({ userVaults })
  return (
    <PageContainer>
      {
        loading ? 
          <Center>
            <Spinner />
          </Center> :
          <>
            <CTAButton bg={colors.background.three} onClick={onOpen}>
              Create a Vault
            </CTAButton>
            <Grid templateColumns='repeat(3, 1fr)' gap={6}>
            {
              userVaults.map(({vault, strategy}) => {
                return (
                  <GridItem w='100%' h='100%' mb='2'>
                    <VaultSummary vault={vault} viewVault={() => viewMyVault(vault, strategy)} />
                  </GridItem>
                )
              })
            }
            </Grid>
          </>
      }
      <CreateVaultModal isOpen={isOpen} onClose={onClose} />

    </PageContainer>
  );
}

export default MyVaults;
