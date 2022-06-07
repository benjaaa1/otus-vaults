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
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Spacer
} from '@chakra-ui/react';

import { Slider } from "../../../Common/Slider";
import { Select } from "../../../Common/Select";
import { AddButton, RemoveButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext"
import { strikeStrategy } from "../../../../reducer/strategyReducer";
import { ArrowForwardIcon } from "@chakra-ui/icons";

export default function StrategyDetail() {

  const { state, dispatch, strategyValue, setVaultStrategy, trade } = useStrategyContext();

  const {
    liveBoards,
    liveStrikes,
    needsQuotesUpdated,
    currentStrikes,
    activeCurrentStrikeIndex
  } = state; 

  const { activeBoardId } = strategyValue;
  console.log({ activeBoardId })
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Flex bg="#333" minWidth='max-content' alignItems='center' p={'4'}>
        <Box>
          <Select bg={'white'} isDisabled={activeBoardId > 0} id='board' placeholder={'Select Round Expiry'} onChange={(e) => dispatch({ type: 'SET_SELECTED_BOARD', payload: e.target.value })}>
          {
            Object.values(liveBoards).map(({ name, id }) => (<option selected={id == activeBoardId} value={id}>{name}</option>))
          }
          </Select>
        </Box>
        <Spacer />
        <Button onClick={setVaultStrategy} rightIcon={<ArrowForwardIcon />}>Set Round Strategy</Button>
      </Flex>
      <Box>
        <Box>
        {
          currentStrikes.map((cs, index) => {
            return (
              <Accordion allowToggle>
                <AccordionItem>
                  <Flex minWidth='max-content' alignItems='center' p={'2'}>
                    <Box flex='1'>
                      <RemoveButton onClick={() => dispatch({ type: 'REMOVE_CURRENT_STRIKE', payload: index })} />
                    </Box>
                    <Box>
                      <Button onClick={() => trade(index)} rightIcon={<ArrowForwardIcon />}>Trade</Button>
                    </Box>
                    <Spacer />
                    <Box>
                      <Select bg={'white'} id='board' onChange={(e) => dispatch({ type: 'SET_CURRENT_STRIKE_OPTION_TYPE', payload: { index, value: e.target.value} })}>
                        {
                          [
                            { name: 'Buy Call', id: 0 }, { name: 'Buy Put', id: 1 }, { name: 'Sell Call', id: 3 }, { name: 'Sell Put', id: 4 }
                          ].map(({name, id}) => (<option value={id}>{name}</option>))
                        }
                      </Select>
                    </Box>
                    <Spacer />
                    <Box>
                      <Button onClick={() => {
                          onOpen();
                          dispatch({ type: 'ACTIVE_CURRENT_STRIKE_INDEX', payload: index })
                        }}>
                          Set Strike Strategy
                      </Button>
                    </Box>
                    <Spacer />
                    <Box>
                      <AccordionButton>
                        <AccordionIcon />
                      </AccordionButton>
                    </Box>
                  </Flex>
                <AccordionPanel pb={4}>
                  <TableContainer>
                    <Table size='sm'>
                    <Thead>
                      <Tr>
                        <Th isNumeric>Strike</Th>
                        <Th isNumeric>Implied Volatility</Th>
                        <Th isNumeric>Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {
                        liveStrikes.map((strike) => {
                          const { id } = strike;
                          const currentSelectedId = currentStrikes[index]['id']; 
                          return <Tr>
                            <Td isNumeric>${ strike.strikePrice }</Td>
                            <Td isNumeric>{ strike.iv_formatted }</Td>
                            <Td isNumeric>
                              <Button colorScheme={ currentSelectedId == id ? 'teal' : 'gray'} size='sm' isLoading={needsQuotesUpdated} onClick={() => dispatch({ type: 'UPDATE_CURRENT_STRIKE', payload: { index, strike } })}>
                                ${ strike.pricePerOption }
                              </Button>
                            </Td>
                          </Tr>
                        })
                      }
                    </Tbody>
                    </Table>
                  </TableContainer>
                </AccordionPanel>
                </AccordionItem>
              </Accordion>
            )
          })
        }
        </Box>
      </Box>
      <Flex minWidth='max-content' alignItems='flex-end' gap='2' p={'4'}>
        <AddButton onClick={() => dispatch({ type: 'ADD_CURRENT_STRIKE' })} />
      </Flex>

      <StrikeStrategyModal isOpen={isOpen} onClose={onClose} index={activeCurrentStrikeIndex} dispatch={dispatch} />
    </>
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