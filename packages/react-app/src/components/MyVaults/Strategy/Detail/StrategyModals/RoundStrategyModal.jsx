import React, { useState } from "react";

import {
  Flex, 
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack
} from '@chakra-ui/react';

import { Slider } from "../../../../Common/Slider";
import { useStrategyContext } from "../../../../../context/StrategyContext"
import colors from "../../../../../designSystem/colors";
import { CreateButton } from "../../../../Common/Button";

export const RoundStrategyModal = ({ isOpen, onClose }) => {

  const [isLoading, setLoading] = useState(false);

  const { state, dispatch, setVaultStrategy } = useStrategyContext();

  const { vaultStrategy } = state; 

  const { 
    collatBuffer, 
    collatPercent,
    minTimeToExpiry,
    maxTimeToExpiry,
    minTradeInterval,
    gwavPeriod,
  } = vaultStrategy;

  const save = async () => {
    console.log({ vaultStrategy })
    setLoading(true);

    await setVaultStrategy(); 
    setLoading(false);

    onClose(); 

  }
  
  const setValue = (id, value) => {
    dispatch({ type: 'UPDATE_ROUND_STRATEGY', payload: { value, id } })
  }

  return (
    <>
      <Modal borderRadius={'none'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Strategy</ModalHeader>
          <ModalCloseButton />

          <ModalBody>

              <Stack spacing={6}>
          
                <Flex>
                  <Box flex='1'>
                    <Slider name={"Collateral Buffer"} step={10} min={0} max={200} id={"collatBuffer"} setSliderValue={setValue} sliderValue={collatBuffer} label={'%'} />    
                  </Box>
                </Flex>
        
                <Flex>
                  <Box flex='1'>
                    <Slider name={"Collateral Percent"} step={5} min={25} max={100} id={"collatPercent"} setSliderValue={setValue} sliderValue={collatPercent} label={'%'} />    
                  </Box>
                </Flex>
                
                <Flex>
                  <Box flex='1'>
                    <Slider name={"Min. Time to Expiry"} step={1} min={0} max={12} id={"minTimeToExpiry"} setSliderValue={setValue} sliderValue={minTimeToExpiry} label={' hours'} />    
                  </Box>
                </Flex>
                
                <Flex>
                  <Box flex='1'>
                    <Slider name={"Max Time to Expiry"} step={1} min={0} max={16} id={"maxTimeToExpiry"} setSliderValue={setValue} sliderValue={maxTimeToExpiry} label={' weeks'} />    
                  </Box>
                </Flex>
                
                <Flex>
                  <Box flex='1'>
                    <Slider name={"Min. Trade Interval"} step={1} min={0} max={60} id={"minTradeInterval"} setSliderValue={setValue} sliderValue={minTradeInterval} label={' minutes'} />    
                  </Box>
                </Flex>
                
                <Flex>
                  <Box flex='1'>
                    <Slider name={"GWAV Period"} step={1} min={0} max={60} id={"gwavPeriod"} setSliderValue={setValue} sliderValue={gwavPeriod} label={' minutes'} />    
                  </Box>
                </Flex>
      
              </Stack>

          </ModalBody>

          <ModalFooter>

            <CreateButton isLoading={isLoading} onClick={save}>
              Save
            </CreateButton>

          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}