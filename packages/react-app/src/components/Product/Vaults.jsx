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
    <BaseShadowBox onClick={viewVault} padding={theme.padding.lg} _hover={{ boxShadow: '2px 2px 2px #a8a8a8' }}>
      <Stack spacing={4}>
        <Box>
          <ProductTag>

          </ProductTag>
          <AssetTag>
            
          </AssetTag>

          <Text fontSize='xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>Test Vault</Text>

        </Box>

        <Box borderBottom={'1px solid #333'}>
          <Text fontSize='2xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>T2ST-ETH</Text>
        </Box>
        
        <Box borderBottom={'1px solid #333'}>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Current Projected Yield</Text>
          <Text fontSize='2xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{currentAPR}%</Text>
        </Box>


        <Box>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Strike Prices</Text>
          <Flex>
          {
            ['1400', '1500', '1000', '900'].map(strike => {
              return <Box flex={'1'}>
                <Text fontWeight={'700'} fontSize='xs' fontFamily={`'IBM Plex Mono', monospace`}>{ strike }</Text>
              </Box>
            })
          }
          </Flex>
        </Box>

        <Box>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Current Price</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>$1200</Text>
        </Box>
          
        <Box>
          {/* <VaultButton onClick={viewVault}>{vault.substring(0, 8)}...</VaultButton> */}

          max capacity 
        </Box>
      </Stack>
    </BaseShadowBox>
  )
}