import React from "react";

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
} from '@chakra-ui/react';

import { Slider } from "../../../../Common/Slider";
import { useStrategyContext } from "../../../../../context/StrategyContext"
import colors from "../../../../../designSystem/colors";

export const RoundStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch } = useStrategyContext();

  const { vaultStrategy } = state; 

  const { 
    collatBuffer, 
    collatPercent,
    minTimeToExpiry,
    maxTimeToExpiry,
    minTradeInterval,
    gwavPeriod,
  } = vaultStrategy;

  console.log({ 
    collatBuffer, 
    collatPercent,
    minTimeToExpiry,
    maxTimeToExpiry,
    minTradeInterval,
    gwavPeriod,
  });

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
            <Flex>
              <Box flex='1'>
              <Slider name={"Collateral Buffer"} step={.1} min={1} max={2} id={"collatBuffer"} setSliderValue={setValue} sliderValue={collatBuffer} label={''} />    
              <Slider name={"Collateral Percent"} step={.05} min={.25} max={1} id={"collatPercent"} setSliderValue={setValue} sliderValue={collatPercent} label={'%'} />    
              <Slider name={"Min. Time to Expiry"} step={1} min={0} max={12} id={"minTimeToExpiry"} setSliderValue={setValue} sliderValue={minTimeToExpiry} label={' hours'} />    
              <Slider name={"Max Time to Expiry"} step={1} min={0} max={16} id={"maxTimeToExpiry"} setSliderValue={setValue} sliderValue={maxTimeToExpiry} label={' weeks'} />    
              <Slider name={"Min. Trade Interval"} step={1} min={0} max={60} id={"minTradeInterval"} setSliderValue={setValue} sliderValue={minTradeInterval} label={' minutes'} />    
              <Slider name={"GWAV Period"} step={1} min={0} max={60} id={"gwavPeriod"} setSliderValue={setValue} sliderValue={gwavPeriod} label={' minutes'} />    
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => {
              dispatch({ type: 'RESET_ROUND_STRATEGY' })
              onClose()
            }}>
              Cancel
            </Button>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}