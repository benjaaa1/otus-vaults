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

export const StrikeStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch } = useStrategyContext();

  const { strikeStrategy } = state; 

  const setValue = (id, value, optionType) => {
    dispatch({ type: 'UPDATE_STRIKE_STRATEGY', payload: { value, id, optionType } })
  }

  return (
    <>
      <Modal borderRadius={'none'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Strike Strategies</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Flex>
              <Box flex='1'>
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} id2={0} setSliderValue={setValue} sliderValue={strikeStrategy[0].targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} id2={0} setSliderValue={setValue} sliderValue={strikeStrategy[0].maxDeltaGap} label={''} />
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} id2={0} setSliderValue={setValue} sliderValue={strikeStrategy[0].maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} id2={0} setSliderValue={setValue} sliderValue={strikeStrategy[0].minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} id2={0} setSliderValue={setValue} sliderValue={strikeStrategy[0].maxVol} label={''} />
              </Box>
            </Flex>

            <Flex>
              <Box flex='1'>
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} id2={1} setSliderValue={setValue} sliderValue={strikeStrategy[1].targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} id2={1} setSliderValue={setValue} sliderValue={strikeStrategy[1].maxDeltaGap} label={''} />
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} id2={1} setSliderValue={setValue} sliderValue={strikeStrategy[1].maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} id2={1} setSliderValue={setValue} sliderValue={strikeStrategy[1].minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} id2={1} setSliderValue={setValue} sliderValue={strikeStrategy[1].maxVol} label={''} />
              </Box>
            </Flex>

            <Flex>
              <Box flex='1'>
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} id2={3} setSliderValue={setValue} sliderValue={strikeStrategy[3].targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} id2={3} setSliderValue={setValue} sliderValue={strikeStrategy[3].maxDeltaGap} label={''} />
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} id2={3} setSliderValue={setValue} sliderValue={strikeStrategy[3].maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} id2={3} setSliderValue={setValue} sliderValue={strikeStrategy[3].minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} id2={3} setSliderValue={setValue} sliderValue={strikeStrategy[3].maxVol} label={''} />
              </Box>
            </Flex>

            <Flex>
              <Box flex='1'>
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} id2={4} setSliderValue={setValue} sliderValue={strikeStrategy[4].targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} id2={4} setSliderValue={setValue} sliderValue={strikeStrategy[4].maxDeltaGap} label={''} />
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} id2={4} setSliderValue={setValue} sliderValue={strikeStrategy[4].maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} id2={4} setSliderValue={setValue} sliderValue={strikeStrategy[4].minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} id2={4} setSliderValue={setValue} sliderValue={strikeStrategy[4].maxVol} label={''} />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            {/* <Button colorScheme='blue' mr={3} onClick={() => {
              dispatch({ type: 'RESET_CURRENT_STRIKE_STRATEGY', payload: { activeIndex: activeCurrentStrikeIndex } })
              onClose()
            }}>
              Cancel
            </Button> */}
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}