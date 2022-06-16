import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import useWeb3 from "../../hooks/useWeb3";
import { formatUnits } from "ethers/lib/utils";

import theme from "../../designSystem/theme";
import { Grid, GridItem, Box, Stack, Flex, Text } from '@chakra-ui/react';
import { BaseShadowBox } from "../Common/Container";
import { AssetTag, ProductTag } from "../Common/Tags";
import { VaultButton } from "../Common/Button"; 

export const Vaults = ({ vaults }) => {
  const history = useHistory();

  const viewVault = (vault) => {
    history.push(`/vault/${vault}`);
  }
  return <Grid templateColumns='repeat(3, 1fr)' gap={6}>
    {
      vaults.map(vault => 
        <GridItem w='100%' h='100%' mb='2'>
          <VaultSummary vault={vault} viewVault={() => viewVault(vault)} />
        </GridItem>
      )
    }
    </Grid>
  
}

export const VaultSummary = ({ vault, viewVault }) => {

  const { contracts } = useWeb3({ OtusVault: vault });

  const otusVault = contracts ? contracts['OtusVault'] : "";

  const [currentAPR, setCurrentAPR] = useState('')

  useEffect(async() => {
    if(otusVault) {
      try {
        const vaultParams = await otusVault.vaultParams(); 
        console.log({ vaultParams })

        const vaultState = await otusVault.vaultState(); 
        console.log({
          round: formatUnits(vaultState.round, 6),
          lockedAmount: formatUnits(vaultState.lockedAmount),
          lastLockedAmount: formatUnits(vaultState.lastLockedAmount),
          totalPending: formatUnits(vaultState.totalPending),
          queuedWithdrawShares: formatUnits(vaultState.queuedWithdrawShares),
          nextRoundReadyTimestamp: formatUnits(vaultState.nextRoundReadyTimestamp),
          roundInProgress: vaultState.roundInProgress
        });

        const roundPremiumCollected = await otusVault.roundPremiumCollected();
        const _currentAPR =  formatUnits(roundPremiumCollected) * 52 / formatUnits(vaultState.lockedAmount) * 100; 
        setCurrentAPR(_currentAPR); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVault])

  return (
    <BaseShadowBox padding={theme.padding.lg}>
      <Stack spacing={4}>
        <Box>
          <ProductTag>

          </ProductTag>
          <AssetTag>
            
          </AssetTag>
        </Box>

        
        <Box>
          <Text fontSize='xs'>Current Projected Yield</Text>
          <Text fontSize='xxl'>{currentAPR}%</Text>
        </Box>


        <Flex>
          <Box flex={1}>
          <Text fontSize='xs'>Strike Prices </Text>
          </Box>
          <Box flex={1}>
            <Text fontSize='xs'>Current Projected Yield</Text>
          </Box>
        </Flex>
          
        <Box>
          <VaultButton onClick={viewVault}>{vault.substring(0, 8)}...</VaultButton>
        </Box>
      </Stack>
    </BaseShadowBox>
  )
}