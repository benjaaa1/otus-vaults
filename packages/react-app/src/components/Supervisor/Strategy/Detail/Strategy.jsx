import React from "react";
import { formatUnits } from "ethers/lib/utils";

import {
  Flex, 
  Box,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';

import { Slider } from "../../../Common/Slider";
import { Select } from "../../../Common/Select";
import { AddButton, RemoveButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext"
import { strikeStrategy } from "../../../../reducer/strategyReducer";

export default function StrategyDetail() {

  const { state, dispatch } = useStrategyContext();

  const {
    liveBoards,
    liveStrikes,
    currentStrikes,
    activeCurrentStrikeIndex
  } = state; 

  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex>

      <VStack>
        <Box >
          <Select id='board' placeholder={'Select Round Expiry'} onChange={(e) => dispatch({ type: 'SET_SELECTED_BOARD', payload: e.target.value })}>
          {
            Object.values(liveBoards).map(({ name, id }) => (<option value={id}>{name}</option>))
          }
          </Select>
        </Box>
        <Box>
          {
            currentStrikes.map((cs, index) => {
              return (
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box flex='1' textAlign='left'>
                          { cs.strikePrice }
                          <Button onClick={() => {
                            onOpen();
                            dispatch({ type: 'ACTIVE_CURRENT_STRIKE_INDEX', payload: index })
                          }}>
                            Set Strike Strategy
                          </Button>
                          <RemoveButton onClick={() => dispatch({ type: 'REMOVE_CURRENT_STRIKE', payload: index })} />
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      {
                        liveStrikes.map(strike => {
                          return <Box>
                            ${ strike.name }
                            <AddButton onClick={() => dispatch({ type: 'UPDATE_CURRENT_STRIKE', payload: { index, strike } })} />
                          </Box>
                        })
                      }
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )
            })
          }
         
        </Box>
        <AddButton onClick={() => dispatch({ type: 'ADD_CURRENT_STRIKE' })} />

      </VStack> 
      <StrikeStrategyModal isOpen={isOpen} onClose={onClose} index={activeCurrentStrikeIndex} dispatch={dispatch} />
    </Flex>
  )

}

const StrikeStrategyModal = ({ isOpen, onClose }) => {

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
      <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Strategy</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Flex>
              <Box flex='1'>
                <Button onClick={() => console.log('Select Option Put')}>
                  Select Option Put
                </Button>
                <Select id='optionType' value={optionType} placeholder={'Select Option Put'} onChange={(e) => setValue('optionType', e.target.value)}>
                {
                  [
                    {
                      id: 3,
                      name: 'SHORT_CALL_QUOTE'
                    },
                    {
                      id: 4,
                      name: 'SHORT_PUT_QUOTE'
                    }
                  ].map(({ name, id }) => (<option value={id}>{name}</option>))
                }
                </Select>
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
            <Button variant='ghost'>Secondary Action</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}