import React, { useEffect, useState } from "react";
import { Button } from "../Common/Button"; 
import { useHistory } from "react-router-dom";
import { Grid, GridItem, Box, IconButton } from '@chakra-ui/react';
import { BaseShadowBox } from "../Common/Container";
import { AssetTag, ProductTag } from "../Common/Tags";
import theme from "../../designSystem/theme";
import { useContractLoader } from "eth-hooks";
import { formatUnits } from "ethers/lib/utils";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import useWeb3 from "../../hooks/useWeb3";

export const Vaults = ({ vaults }) => {

  return <Grid templateColumns='repeat(3, 1fr)' gap={6}>
    {
      vaults.map(vault => 
        <GridItem w='100%' h='10' mb='10'>
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
      <Button onClick={() =>  history.push(`/vault/${vault}`)}>{vault}</Button>
      </Box>
    </BaseShadowBox>
  )
}