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

import { Slider } from "../../../Common/Slider";
import { useStrategyContext } from "../../../../context/StrategyContext"
import { strikeStrategy } from "../../../../reducer/strategyReducer";
import colors from "../../../../designSystem/colors";

export const StrikeStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch } = useStrategyContext();

  const { activeCurrentStrikeIndex, currentStrikes } = state; 

  const currentStrike = 
    currentStrikes[activeCurrentStrikeIndex] || strikeStrategy;

  const { 
    targetDelta,
    maxDeltaGap,
    minVol,
    maxVol,
    maxVolVariance,
    optionType
  } = currentStrike;

  console.log({ 
    targetDelta,
    maxDeltaGap,
    minVol,
    maxVol,
    maxVolVariance,
    optionType
  });

  const setValue = (id, value) => {
    dispatch({ type: 'UPDATE_CURRENT_STRIKE_STRATEGY', payload: { value, id, activeIndex: activeCurrentStrikeIndex } })
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
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} setSliderValue={setValue} sliderValue={targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} setSliderValue={setValue} sliderValue={maxDeltaGap} label={''} />
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} setSliderValue={setValue} sliderValue={maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} setSliderValue={setValue} sliderValue={minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} setSliderValue={setValue} sliderValue={maxVol} label={''} />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={() => {
              dispatch({ type: 'RESET_CURRENT_STRIKE_STRATEGY', payload: { activeIndex: activeCurrentStrikeIndex } })
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