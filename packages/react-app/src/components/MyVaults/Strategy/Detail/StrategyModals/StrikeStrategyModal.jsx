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
  Stack,
  Text
} from '@chakra-ui/react';

import { Slider } from "../../../../Common/Slider";
import { useStrategyContext } from "../../../../../context/StrategyContext"
import colors from "../../../../../designSystem/colors";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { CreateButton } from "../../../../Common/Button";

export const StrikeStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch } = useStrategyContext();

  const { strikeStrategy } = state; 

  const setValue = (id, value, optionType) => {
    dispatch({ type: 'UPDATE_STRIKE_STRATEGY', payload: { value, id, optionType } })
  }

  const [step, setStep] = useState(0); 
  const [optionType, setOptionType] = useState(0); 

  return (
    <>
      <Modal size={'2xl'} borderRadius={'none'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Strike Strategy</ModalHeader>
          <ModalCloseButton />

          <ModalBody>

            <Flex>

              <Box flex={1} bg={colors.background.two} borderRight={`1px solid ${colors.borderLight}`} marginRight={2}>
                <StrikeStrategyNav
                  step={step} 
                  setStep={setStep} 
                  setOptionType={setOptionType}
                />
              </Box>

              <Box flex={4} mt="4" p={6}>
                <Stack spacing={6}>

                  <Flex>
                    <Box flex='1'>
                      <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} id2={optionType} setSliderValue={setValue} sliderValue={strikeStrategy[optionType].targetDelta} label={''} />    
                    </Box>
                  </Flex>
                  
                  <Flex>
                    <Box flex='1'>
                      <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} id2={optionType} setSliderValue={setValue} sliderValue={strikeStrategy[optionType].maxDeltaGap} label={''} />
                    </Box>
                  </Flex>

                  <Flex>
                    <Box flex='1'>
                      <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} id2={optionType} setSliderValue={setValue} sliderValue={strikeStrategy[optionType].maxVolVariance} label={''} />
                    </Box>
                  </Flex>

                  <Flex>
                    <Box flex='1'>
                      <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} id2={optionType} setSliderValue={setValue} sliderValue={strikeStrategy[optionType].minVol} label={''} />
                    </Box>
                  </Flex>

                  <Flex>
                    <Box flex='1'>
                      <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} id2={optionType} setSliderValue={setValue} sliderValue={strikeStrategy[optionType].maxVol} label={''} />
                    </Box>
                  </Flex>
                  
                </Stack>
              </Box>

            </Flex>

            {/* <Flex>
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
            </Flex> */}
          </ModalBody>

          <ModalFooter>
            {/* <Button colorScheme='blue' mr={3} onClick={() => {
              dispatch({ type: 'RESET_CURRENT_STRIKE_STRATEGY', payload: { activeIndex: activeCurrentStrikeIndex } })
              onClose()
            }}>
              Cancel
            </Button> */}

            <CreateButton onClick={onClose}>
              Save All
            </CreateButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

const StrikeStrategyNav = ({ 
  step, 
  setStep,
  setOptionType
}) => {

  const navToStep = (_step, _optionType) => {
    setStep(_step);
    setOptionType(_optionType)
  }

  return (
    <Stack>
      <Text color={colors.text.light} onClick={() => navToStep(0, 0)} fontWeight={step == 0 ? '700' : '400'} fontSize='xs'>{ step == 0 ? <ArrowForwardIcon /> : null } Buy Call </Text>
      <Text color={colors.text.light} onClick={() => navToStep(1, 1)} fontWeight={step == 1 ? '700' : '400'} fontSize='xs'>{ step == 1 ? <ArrowForwardIcon /> : null } Buy Put </Text>
      <Text color={colors.text.light} onClick={() => navToStep(2, 3)} fontWeight={step == 2 ? '700' : '400'} fontSize='xs'>{ step == 2 ? <ArrowForwardIcon /> : null } Sell Call </Text>
      <Text color={colors.text.light} onClick={() => navToStep(3, 4)} fontWeight={step == 3 ? '700' : '400'} fontSize='xs'>{ step == 3 ? <ArrowForwardIcon /> : null } Sell Put </Text>
    </Stack>
  )
}