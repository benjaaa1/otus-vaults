import React, { useState, useEffect } from "react";
import { OtusModal } from "../../../Common/Modal";
import { formatUnits } from "ethers/lib/utils";
import { useDisclosure } from '@chakra-ui/react'
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'
import { BaseButton } from "../../../../designSystem";

export const StrikesModal = ({ lyraMarket, show }) => {

  const [board, setBoard] = useState(); 

  const [strikes, setStrikes] = useState([]); 

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(async () => {
    if(lyraMarket) {
      try {
        const liveBoard = await lyraMarket.liveBoards(); 
        console.log({ liveBoard }); 
        setBoard(liveBoard);
      } catch (error) {
        console.log({error})
      }
    }
  }, [lyraMarket])

  useEffect(() => {
    if(board) {
      const inDeltaRangeStrikes = board[0].strikes().filter(strike => strike.isDeltaInRange);
      console.log({ inDeltaRangeStrikes }); 
      setStrikes(inDeltaRangeStrikes);
    }
  }, [board]);

  useEffect(() => {
    if(show) {
      onOpen()
    } else {
      onClose()
    }
  }, [show])


  return (
    <OtusModal title={'Lyra Board Strikes'} isOpen={isOpen} onClose={onClose}>
      <TableContainer>
        <Table variant='simple'>
          <TableCaption>Imperial to metric conversion factors</TableCaption>
          <Thead>
            <Tr>
              <Th isNumeric>Strike</Th>
              <Th isNumeric>Implied Volatility</Th>
              <Th isNumeric></Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              strikes.map(strike => ({
                strikeId: strike.id,
                iv: formatUnits(strike.iv),
                skew: formatUnits(strike.skew),
                strikePrice: formatUnits(strike.strikePrice),
                vega: formatUnits(strike.vega)
              })).map(strike => <Tr>
                <Td>{ strike.strikePrice }</Td>
                <Td>{ strike.iv }</Td>
                <Td><BaseButton onClick={() => console.log(strike)}>Select</BaseButton></Td>
              </Tr>)
            }
          </Tbody>
          <Tfoot>
            <Tr>
              <Th isNumeric>Strike</Th>
              <Th isNumeric>Implied Volatility</Th>
              <Th isNumeric></Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
    </OtusModal>
  )
}