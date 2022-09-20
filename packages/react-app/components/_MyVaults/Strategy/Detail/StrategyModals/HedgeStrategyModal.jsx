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
} from '@chakra-ui/react';

import { Slider } from "../../../../_Common/Slider";
import { useStrategyContext } from "../../../../../context/StrategyContext"
import colors from "../../../../../designSystem/colors";
import { CreateButton } from "../../../../_Common/Button";

export const HedgeStrategyModal = ({ isOpen, onClose }) => {

  const [isLoading, setLoading] = useState(false);

  const { state, dispatch, setHedgeStrategy } = useStrategyContext();

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

  const save = async () => {
    setLoading(true);

    await setHedgeStrategy(); 

    setLoading(false);
    onClose(); 

  }
  

  const setValue = (id, value) => {
    dispatch({ type: 'UPDATE_HEDGE_STRATEGY', payload: { value, id } })
  }

  return (
    <>
      <Modal borderRadius={'none'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Hedge Strategy</ModalHeader>
          <ModalCloseButton />

          <ModalBody>

              <Stack spacing={6} align='stretch'>

              <Flex>
                <Box flex='1'>
                  <Slider name={"Hedge Percentage"} step={.1} min={-1} max={1} id={"hedgePercentage"} setSliderValue={setValue} sliderValue={hedgePercentage} label={''} />
                </Box>
              </Flex>

              <Flex>
                <Box flex='1'>
                  <Slider name={"Max Hedge Attempts"} step={.05} min={0} max={.5} id={"maxHedgeAttempts"} setSliderValue={setValue} sliderValue={maxHedgeAttempts} label={''} />
                </Box>
              </Flex>

              <Flex>
                <Box flex='1'>
                  <Slider name={"Leverage Size"} step={.1} min={0} max={1} id={"leverageSize"} setSliderValue={setValue} sliderValue={leverageSize} label={''} />
                </Box>
              </Flex>

              <Flex>
                <Box flex='1'>
                  <Slider name={"Stop Loss Limit"} step={.1} min={0} max={2} id={"stopLossLimit"} setSliderValue={setValue} sliderValue={stopLossLimit} label={''} />
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