import React from "react";

import { Flex, Stack, Box } from '@chakra-ui/react'
import { Slider } from "../../Common/Slider";
import { useCreateVaultContext } from "../../../context/CreateVaultContext";

const StrategyStep = () => {

  const { state, updateVaultStrategy } = useCreateVaultContext(); 
  
  const { vaultStrategy } = state; 

  const {
    collatBuffer, 
    collatPercent,
    minTimeToExpiry,
    maxTimeToExpiry,
    minTradeInterval,
    gwavPeriod,
  } = vaultStrategy; 

  return (
      <Box p={'6'}>

        <Stack spacing={6}>
          
        <Flex>
          <Box flex='1'>
            <Slider name={"Collateral Buffer"} step={.1} min={1} max={2} id={"collatBuffer"} setSliderValue={updateVaultStrategy} sliderValue={collatBuffer} label={''} />    
          </Box>
        </Flex>

        <Flex>
          <Box flex='1'>
            <Slider name={"Collateral Percent"} step={.05} min={.25} max={1} id={"collatPercent"} setSliderValue={updateVaultStrategy} sliderValue={collatPercent} label={'%'} />    
          </Box>
        </Flex>
        
        <Flex>
          <Box flex='1'>
            <Slider name={"Min. Time to Expiry"} step={1} min={0} max={12} id={"minTimeToExpiry"} setSliderValue={updateVaultStrategy} sliderValue={minTimeToExpiry} label={' hours'} />    
          </Box>
        </Flex>
        
        <Flex>
          <Box flex='1'>
            <Slider name={"Max Time to Expiry"} step={1} min={0} max={16} id={"maxTimeToExpiry"} setSliderValue={updateVaultStrategy} sliderValue={maxTimeToExpiry} label={' weeks'} />    
          </Box>
        </Flex>
        
        <Flex>
          <Box flex='1'>
            <Slider name={"Min. Trade Interval"} step={1} min={0} max={60} id={"minTradeInterval"} setSliderValue={updateVaultStrategy} sliderValue={minTradeInterval} label={' minutes'} />    
          </Box>
        </Flex>
        
        <Flex>
          <Box flex='1'>
            <Slider name={"GWAV Period"} step={1} min={0} max={60} id={"gwavPeriod"} setSliderValue={updateVaultStrategy} sliderValue={gwavPeriod} label={' minutes'} />    
          </Box>
        </Flex>

        </Stack>

      </Box>
  )
}

export default StrategyStep;
