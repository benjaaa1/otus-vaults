import React, { useState } from "react";

import { Flex, Spacer, Stack, Heading, Text, FormControl, FormLabel, Switch, Box, Center, Divider, Input } from '@chakra-ui/react'
import { Select } from "../../_Common/Select"; 
import { Slider } from "../../_Common/Slider";
import { useCreateVaultContext } from "../../../context/CreateVaultContext";

const VaultStep = () => {

  const { state, updateVaultInformation, updateVaultParams, onSelectMarket } = useCreateVaultContext(); 

  const { vaultInformation, vaultParams, markets } = state; 

  const { isPublic, managementFee, performanceFee } = vaultInformation; 

  const { cap } = vaultParams; 

  return (

      <Box  p={'6'}>

        <Stack spacing={6}>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <FormLabel fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff" htmlFor='market'>Market</FormLabel>
                <Select width="100%" id='market' placeholder="Select Market" onChange={e => onSelectMarket(e.target.value)}>
                  {
                    markets.map(({ id, name }) => (<option value={id}>{name}</option>))
                  }
                </Select>
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <FormLabel htmlFor='isPublic' fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff">Is Public?</FormLabel>
                <Switch
                  colorScheme='teal'
                  id='isPublic'
                  name='isPublic'
                  isChecked={isPublic}
                  onChange={(check) => updateVaultInformation('isPublic', check)}
                />
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <Slider name={"Maximum Cap."} step={10000} min={0} max={1000000} id={"cap"} label={' sUSD'} setSliderValue={updateVaultParams} sliderValue={cap} />
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <Slider name={"Performance Fee"} step={0.1} min={0} max={10} id={"performanceFee"} label={'%'} setSliderValue={updateVaultInformation} sliderValue={performanceFee} />
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <Slider name={"Management Fee"} step={0.1} min={0} max={10} id={"managementFee"} label={'%'} setSliderValue={updateVaultInformation} sliderValue={managementFee} />
              </FormControl>
            </Box>
          </Flex>

        </Stack>

      </Box>

  )
}

export default VaultStep;
