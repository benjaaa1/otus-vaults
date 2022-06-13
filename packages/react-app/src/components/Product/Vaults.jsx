import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import useWeb3 from "../../hooks/useWeb3";
import { formatUnits } from "ethers/lib/utils";

import theme from "../../designSystem/theme";
import { Grid, GridItem, Box } from '@chakra-ui/react';
import { BaseShadowBox } from "../Common/Container";
import { AssetTag, ProductTag } from "../Common/Tags";
import { Button } from "../Common/Button"; 

export const Vaults = ({ vaults }) => {

  return <Grid templateColumns='repeat(3, 1fr)' gap={6}>
    {
      vaults.map(vault => 
        <GridItem w='100%' h='100%' mb='2'>
          <VaultSummary vault={vault} />
        </GridItem>
      )
    }
    </Grid>
  
}

const VaultSummary = ({ vault }) => {

  const history = useHistory();

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
      <Box>
        <ProductTag>

        </ProductTag>
        <AssetTag>
          
        </AssetTag>
      </Box>
      <Box>
        
      </Box>
      
      <Box>
        APR: {currentAPR}%
      </Box>
      <Box>
        
      </Box>

      <Box>
      <Button onClick={() =>  history.push(`/vault/${vault}`)}>{vault.substring(0, 8)}...</Button>
      </Box>
    </BaseShadowBox>
  )
}