import React, { useEffect, useState } from "react";
import { formatUnits } from "ethers/lib/utils";

import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormControl,
  FormLabel,
  Spinner,
  Center
} from '@chakra-ui/react';

import { Slider } from "../../../_Common/Slider";
import { Select } from "../../../_Common/Select";
import { AddButton, RemoveButton, ViewLinkButton } from "../../../_Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext"
import colors from "../../../../designSystem/colors";
import { formatStrikeQuotes } from "../../../../helpers/strategy";

export default function StrikesModal({ isOpen, onClose }) {

  const { state, dispatch } = useStrategyContext();

  const { activeCurrentStrikeIndex, selectedBoard } = state; 

  const [loading, setLoading] = useState(false); 

  const [optionType, selectOptionType] = useState(null); 

  const [liveStrikes, setLiveStrikes] = useState([]); 

  const getStrikes = async (_isCall, _isBuy) => {
    const liveBoardStrikes = await Promise.all(selectedBoard.strikes).then((values) => {
      return values; 
    });
    const _liveStrikesWithFees = await formatStrikeQuotes(liveBoardStrikes, _isCall, _isBuy, 1);
    console.log({ _liveStrikesWithFees })
    return _liveStrikesWithFees; 
  }

  useEffect(async () => {
    try {
      setLoading(true); 
      //is CALL is BUY 
      const [isCall, isBuy] = getOptionType(optionType); 
      const _liveStrikes = await getStrikes(isCall, isBuy); 
      console.log({ liveStrikes })
      setLiveStrikes(_liveStrikes); 
    } catch (error) {
      
    }
    setLoading(false);
  }, [optionType])

  return (
    <Modal borderRadius={'none'} size={'xl'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
      <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
        <ModalHeader>Strikes</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Box flex='1' mb={4}>
            <FormControl>
              <FormLabel fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff" htmlFor='market'>Market</FormLabel>

              <Select id='board' onChange={(e) => selectOptionType(e.target.value)}>
              <option value={null}>Select Option Type</option>
              {
                [
                { name: 'Buy Call', id: 0 }, { name: 'Buy Put', id: 1 }, { name: 'Sell Call', id: 3 }, { name: 'Sell Put', id: 4 }
                ].map(({name, id}) => (<option value={id}>{name}</option>))
              }
              </Select>
            </FormControl>
              
          </Box>

          <TableContainer mb={4}>
          <Table variant={'simple'} size='sm' colorScheme={'#f5f5f5'}>
            <Thead>
              <Tr>
                <Th isNumeric>Strike</Th>
                <Th isNumeric>Implied Volatility</Th>
                <Th isNumeric>Price</Th>
              </Tr>
            </Thead>
            <Tbody>
            {
              loading ? 
              <Center>
                <Spinner />
              </Center> :
              liveStrikes.map((strike) => {
              const { id } = strike;
              return <Tr>
                <Td border={'none'} isNumeric>${ roundToTwo(strike.strikePrice)  }</Td>
                <Td border={'none'} isNumeric>{ parseFloat(strike.iv_formatted).toFixed(2) * 100 }%</Td>
                <Td border={'none'} isNumeric>
                {/* isLoading={needsQuotesUpdated} */}
                  <AddButton width={'100px'} size='sm'  onClick={() => {
                    dispatch({ type: 'UPDATE_CURRENT_STRIKE', payload: { index: activeCurrentStrikeIndex, strike, optionType } })
                    onClose()
                  }}>
                    ${ roundToTwo(strike.pricePerOption) }
                  </AddButton>
                </Td>
              </Tr>
              })
            }
            </Tbody>
          </Table>
          </TableContainer>
        </ModalBody>

      </ModalContent>
    </Modal>
  )

}

const getOptionType = (id) => {
  console.log({ id })
  switch (parseInt(id)) {
    // ISCALL is ISBUY
    case 0:
      return [true, true]
    case 1:
      return [false, true]
    case 3:
      return [true, false]
    case 4:
      return [false, false]
    default:
      return [true, true]
  }
}

const roundToTwo = (num) => {
  return +(Math.round(num + "e+2")  + "e-2");
}