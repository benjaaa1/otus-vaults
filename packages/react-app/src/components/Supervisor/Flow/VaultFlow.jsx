import React, { useState } from "react";

import { Flex, Spacer, Stack, Heading, Text, FormControl, FormLabel, Switch, Box, Center, Divider, Input } from '@chakra-ui/react'
import { NextButton } from "../../Common/Button"; 
import { Select } from "../../Common/Select"; 
import { Slider } from "../../Common/Slider";
import { BaseShadowBox } from "../../Common/Container";
import useCreateVault from "../../../hooks/useCreateVault";

const VaultFlow = () => {

  const {
    loading, 
    vaultDetails, 
    vaultTypes, 
    onSelectMarket, 
    onSelectVaultType, 
    onVaultNameChange,
    createVaultWithStrategy, 
    markets
  } = useCreateVault();

  const [hasPerformanceFee, setHasPerformanceFee] = useState(false);
  const [hasManagementFee, setHasManagementFee] = useState(false);

  return (
    <Center>
      <Box w='474px' m="24">
        <BaseShadowBox>
          <Box bgImage="url('https://bit.ly/2Z4KKcF')">
            <Heading as='h4' p={'6'} pt={'12'}>Set Initial Vault Settings</Heading>
          </Box>

          <Box  p={'6'}>

            <Stack spacing={8}>

              
              <Flex>
                <Box flex={1}>
                  <FormControl>
                    <FormLabel fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595" htmlFor='market'>Vault Name</FormLabel>
                    <Input placeholder='Vault Name' onChange={(e) => onVaultNameChange(e.target.value)} />
                  </FormControl>
                </Box>
              </Flex>

              <Flex>
                <Box flex={1}>
                  <FormControl>
                    <FormLabel fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595" htmlFor='market'>Market</FormLabel>
                    <Select width="100%" id='market' placeholder="Select Market" onChange={e => onSelectMarket(e.target.value)}>
                      {
                        markets.map(({ id, name }) => (<option value={id}>{name}</option>))
                      }
                    </Select>
                  </FormControl>
                </Box>
                <Box flex={1}>
                  <FormControl>
                    <FormLabel fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595" htmlFor='vault'>Vault</FormLabel>
                    <Select width="100%"  id='vault' placeholder="Select Vault Type" onChange={e => onSelectVaultType(e.target.value)}>
                      {
                        vaultTypes.map((name, index) => (<option value={index}>{name}</option>))
                      }
                    </Select>
                  </FormControl>
                </Box>
              </Flex>

              <Divider />

              <Flex>
                <Box>
                  <Text fontSize={'14'} fontFamily={`'IBM Plex Mono', monospace`} color={'#959595'}>
                    Generated Vault Name
                  </Text>
                  <Text as='b' fontSize={'24'} fontFamily={`'IBM Plex Mono', monospace`} textTransform='uppercase' color={'#000'}>
                    { vaultDetails._tokenName }
                  </Text>
                </Box>
                <Spacer />
                <Box>
                  <Text fontSize={'14'} fontFamily={`'IBM Plex Mono', monospace`} color={'#959595'}>
                    Generated Token Symbol
                  </Text>
                  <Text as='b' fontSize={'24'} fontFamily={`'IBM Plex Mono', monospace`} textTransform='uppercase' color={'#000'}>
                    { vaultDetails._tokenSymbol }
                  </Text>
                </Box>
              </Flex>

              <Divider />

              <Flex>
                <Box>
                  <FormControl>
                    <FormLabel htmlFor='isPublic' fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595">Is Public?</FormLabel>
                    <Switch
                      id='isPublic'
                      name='isPublic'
                      isChecked={vaultDetails._isPublic}
                      onChange={(check) => onSelectVaultType(check)}
                    />
                  </FormControl>
                </Box>
                <Spacer />
                <Box>
                  <FormControl>
                    <FormLabel htmlFor='hasPerformanceFee' fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595">Performance Fee?</FormLabel>
                    <Switch
                      id='hasPerformanceFee'
                      name='hasPerformanceFee'
                      isChecked={hasPerformanceFee}
                      onChange={(e) => {
                        setHasPerformanceFee(e.target.checked)
                      }}
                    />
                  </FormControl>
                </Box>
                <Spacer />
                <Box>
                  <FormControl>
                    <FormLabel htmlFor='hasManagementFee' fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`} color="#959595">Management Fee?</FormLabel>
                    <Switch
                      id='hasManagementFee'
                      name='hasManagementFee'
                      isChecked={hasManagementFee}
                      onChange={(e) => setHasManagementFee(e.target.checked)}
                    />
                  </FormControl>
                </Box>
              </Flex>

              <Divider />

              <Flex>

              {
                hasPerformanceFee ?
                <Box>
                  <FormControl>
                    <FormLabel htmlFor='performanceFee' fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`}>Performance Fee</FormLabel>
                    <Slider name={"Performance Fee"} step={0.1} min={0} max={10} id={"performanceFee"} label={'%'} />
                  </FormControl>
                </Box>
                :
                null
              }

              {
                hasManagementFee ?
                <Box>
                  <FormControl>
                    <FormLabel htmlFor='managementFee' fontWeight={'700'} fontSize={'14px'} fontFamily={`'IBM Plex Mono', monospace`}>Management Fee</FormLabel>
                    <Slider name={"Management Fee"} step={0.1} min={0} max={10} id={"managementFee"} label={'%'} />
                  </FormControl>
                </Box>
                :
                null
              }     

              </Flex>   

              <NextButton isLoading={loading} onClick={createVaultWithStrategy} />

            </Stack>

          </Box>

        </BaseShadowBox>
      </Box>
    </Center>
  )
}

export default VaultFlow;
