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

export const HedgeStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch } = useStrategyContext();

  const { hedgeStrategy } = state; 

  const { 
    hedgePercentage,
    maxHedgeAttempts,
    leverageSize,
    stopLossLimit
  } = hedgeStrategy;

  console.log({ 
    hedgePercentage,
    maxHedgeAttempts,
    leverageSize,
    stopLossLimit
  });

  const setValue = (id, value) => {
    dispatch({ type: 'UPDATE_HEDGE_STRATEGY', payload: { value, id } })
  }

  return (
    <>
      <Modal borderRadius={'none'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Strike Strategy</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Flex>
              <Box flex='1'>
                <Slider name={"Hedge Percentage"} step={.1} min={-1} max={1} id={"hedgePercentage"} setSliderValue={setValue} sliderValue={hedgePercentage} label={''} />    
                <Slider name={"Max Hedge Attempts"} step={.05} min={0} max={.5} id={"maxHedgeAttempts"} setSliderValue={setValue} sliderValue={maxHedgeAttempts} label={''} />
                <Slider name={"Leverage Size"} step={.1} min={0} max={1} id={"leverageSize"} setSliderValue={setValue} sliderValue={leverageSize} label={''} />
                <Slider name={"Stop Loss Limit"} step={.1} min={0} max={2} id={"stopLossLimit"} setSliderValue={setValue} sliderValue={stopLossLimit} label={''} />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => {
              dispatch({ type: 'RESET_HEDGE_STRATEGY' })
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