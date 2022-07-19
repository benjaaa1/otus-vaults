import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWeb3 from "../../hooks/useWeb3";
import { formatUnits } from "ethers/lib/utils";

import theme from "../../designSystem/theme";
import { Grid, GridItem, Box, Stack, Flex, Text, Center, HStack } from '@chakra-ui/react';
import { BaseShadowBox } from "../Common/Container";
import { AssetTag, ProductTag } from "../Common/Tags";
import { VaultButton, ViewLinkButton } from "../Common/Button"; 
import useVaultStrategyState from "../../hooks/useVaultsStrategyState";

export const Vaults = ({ vaults }) => {
  let navigate = useNavigate();

  const viewVault = (vault) => {
    navigate(`/vault/${vault}`);
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

  const { vaultInfo, currentBasePrice } = useVaultStrategyState(vault); 

  return (
    <BaseShadowBox padding={theme.padding.lg} _hover={{ boxShadow: '2px 2px 2px #a8a8a8' }}>
      <Stack spacing={4}>
        <Box onClick={viewVault}>
          <ProductTag>

          </ProductTag>
          <AssetTag>
            
          </AssetTag>

          <Text fontSize='xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{ vaultInfo.name }</Text>

        </Box>

        <Box onClick={viewVault}  borderBottom={'1px solid #333'}>
          <Text fontSize='2xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{ vaultInfo.tokenName }</Text>
        </Box>
        
        <Box onClick={viewVault}  borderBottom={'1px solid #333'}>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Current Projected Yield</Text>
          <Text fontSize='2xl' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{vaultInfo.vaultState.currentAPR}%</Text>
        </Box>


        <Box>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Strikes</Text>
          <Flex>
          {
            vaultInfo.strikes.map(strike => {
              return <Box flex={'1'}>
                <Text fontWeight={'700'} fontSize='xs' fontFamily={`'IBM Plex Mono', monospace`}>${ strike.strikePrice }</Text>

                <HStack>

                  <Center w='16px' h='16px' bg={getOptionType( strike.optionType )[1]} color='white'>
                    <Box as='span' fontWeight='bold' fontSize='xs'>
                    { getOptionType( strike.optionType )[0] }
                    </Box>
                  </Center>

                  <ViewLinkButton size='xs' onClick={() => window.location.href = `https://app.lyra.finance/position/eth/${strike.positionId}` } />

                </HStack>

              </Box>
            })
          }
          </Flex>
        </Box>

        <Box onClick={viewVault} >
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Current Price</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>${ vaultInfo.currentBasePrice }</Text>
        </Box>
          
        <Box onClick={viewVault} >
          {/* <VaultButton onClick={viewVault}>{vault.substring(0, 8)}...</VaultButton> */}
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Locked Amount / Max Cap.</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{`${vaultInfo.vaultState.lockedAmount} / ${vaultInfo.vaultParams.cap}`}</Text>

        </Box>
      </Stack>
    </BaseShadowBox>
  )
}

const getOptionType = (id) => {
  switch (id) {
    case 1:
      return ['BC', '#000']
    case 2:
      return ['BP', '#000']
    case 4:
      return ['SC', '#000']
    case 5:
      return ['SP', '#000']
    default:
      return ['', '']
  }
}