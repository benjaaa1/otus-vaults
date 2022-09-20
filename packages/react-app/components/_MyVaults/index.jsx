import React from "react";
import useSupervisor from "../../hooks/useSupervisor";

import { Grid, GridItem, Stack, Center, Flex, Spinner, Box, useDisclosure, HStack } from '@chakra-ui/react'
import { CTAButton } from "../_Common/Button";
import { CreateVaultModal } from "./Flow/CreateModal";
import colors from "../../designSystem/colors";
import { VaultSummary } from "../_Product/Vaults";
import { HeaderContainer, HeaderInternalContainer, PageContainer } from "../_Common/Container";
import { BaseHeaderText } from "../../designSystem";
import theme from "../../designSystem/theme";

const MyVaults = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { userVaults, viewMyVault } = useSupervisor();

  return (
    <>
      <HeaderContainer>
        <HeaderInternalContainer>
          <HStack spacing={6}>
            <Box flex={1}>
              <Box>
                <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                  Build and Manage your own permissionless options vault for any asset. 
                </BaseHeaderText>
              </Box>
              <Box mt={'18'}>
                <CTAButton bg={colors.background.three} onClick={onOpen}>
                  Create a Vault
                </CTAButton>
              </Box>
            </Box>
          </HStack>
        </HeaderInternalContainer>
      </HeaderContainer>

      <PageContainer>

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

        <CreateVaultModal isOpen={isOpen} onClose={onClose} />

      </PageContainer>

    </>

  );
}

export default MyVaults;
