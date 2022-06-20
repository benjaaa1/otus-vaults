import React from "react";
import { formatUnits } from "ethers/lib/utils";

import {
  Flex, 
  Box,
  useDisclosure,
  Spacer,
  Grid, 
  GridItem,
  Stack,
  Text,
  Center
} from '@chakra-ui/react';

import { Slider } from "../../../Common/Slider";
import { Select } from "../../../Common/Select";
import { AddButton, RemoveButton, SelectStrikeButton, SelectStrikeStrategyButton, ViewLinkButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext"
import { strikeStrategy } from "../../../../reducer/strategyReducer";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import colors from "../../../../designSystem/colors";
import { BaseShadowBox } from "../../../Common/Container";
import theme from "../../../../designSystem/theme";
import { StrikeStrategyModal } from "./StrikeStrategyModal";
import StrikesModal from "./StrikesModal";

export default function StrategyDetail() {

  const { state, dispatch, strategyValue, viewVault, setSelectedBoard } = useStrategyContext();

  const {
    selectedBoard,
    liveBoards,
    liveStrikes,
    needsQuotesUpdated,
    currentStrikes,
    activeCurrentStrikeIndex
  } = state; 

  const { activeBoardId } = strategyValue;
  console.log({ activeBoardId })

  const { isOpen: isStrikeSelectModalOpen , onOpen: onStrikeSelectOpen, onClose: onStrikeSelectModalClose } = useDisclosure()
  const { isOpen: isStrikeStrategyModalOpen , onOpen: onStrikeStrategyOpen, onClose: onStrikeStrategyModalClose } = useDisclosure()


  return (
    <>
      <Flex border={'1px solid #333'} minWidth='max-content' alignItems='center' p={4}>
        <Box flex={1} p={2}>
          <ViewLinkButton onClick={viewVault} />
        </Box>
        <Box flex={2} p={2}>
        {/* isDisabled={activeBoardId > 0} only disable if trades occurred */}
          <Select width="100%" id='market' id='board' placeholder={'Select Round Expiry'} onChange={(e) => setSelectedBoard(e.target.value)}>
          {
            Object.values(liveBoards).map(({ name, id }) => (<option value={id}>{name}</option>))
          }
          </Select>
        </Box>
        <Box flex={1} p={2}>
          <AddButton disabled={selectedBoard == null} width={'100%'} onClick={() => dispatch({ type: 'ADD_CURRENT_STRIKE' })}>Add Strike</AddButton>
        </Box>
      </Flex>

      <Grid templateColumns='repeat(4, 1fr)' gap={6}>
        {
          currentStrikes.map((cs, index) => {
            return (
              <GridItem w='100%' h='100%' mb='2'>
                <StrikeSummary 
                  cs={cs} 
                  index={index} 
                  dispatch={dispatch} 
                  onStrikeSelectOpen={onStrikeSelectOpen}
                  onStrikeSelectModalClose={onStrikeSelectModalClose}
                  onStrikeStrategyOpen={onStrikeStrategyOpen}
                  onStrikeStrategyModalClose={onStrikeStrategyModalClose}
                />
              </GridItem>
            )
          })
        }
      </Grid>

      <StrikesModal isOpen={isStrikeSelectModalOpen} onClose={onStrikeSelectModalClose} />
      <StrikeStrategyModal isOpen={isStrikeStrategyModalOpen} onClose={onStrikeStrategyModalClose} />
    </>
  )

}

const StrikeSummary = ({ 
    cs, 
    index, 
    dispatch,
    onStrikeSelectOpen,
    onStrikeSelectModalClose,
    onStrikeStrategyOpen,
    onStrikeStrategyModalClose
  }) => {
  console.log({ cs, index })
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <BaseShadowBox padding={theme.padding.lg}  _hover={{ boxShadow: '2px 2px 2px #a8a8a8' }}>
      <Stack spacing={4}>

        <Box>
          <SelectStrikeButton onClick={() => {
              onStrikeSelectOpen()
              dispatch({ type: 'ACTIVE_CURRENT_STRIKE_INDEX', payload: index })
          }}>
            {
              cs._strike != null ? 
              `$${cs._strike.strikePrice}` :
              'Select Strike'
            }
          </SelectStrikeButton>
        </Box>
        
        <Box>
          <Center w='16px' h='16px' bg={getOptionType( cs.optionType )[1]} color='white'>
            <Box as='span' fontWeight='bold' fontSize='xs'>
            { getOptionType( cs.optionType )[0] }
            </Box>
          </Center>
        </Box>

        {
          cs._strike != null ? 
          <Box>
            <Center bg={cs.optionType == 0 || cs.optionType == 1 ? '#000' : '#84FFC4'} color={cs.optionType == 0 || cs.optionType == 1 ? '#fff' : '#000'}>
              <Box as='span' fontWeight='bold' fontSize='xs'>
              {
                cs.optionType == 0 || cs.optionType == 1 ?
                `Max Cost $${Math.round(cs._strike.pricePerOption)}` :
                `Min. Premium Received $${Math.round(cs._strike.pricePerOption)}`
              }
              </Box>
            </Center>
          </Box> :
          null
        }

        <Box>
          <SelectStrikeStrategyButton 
            onClick={() => {
              onStrikeStrategyOpen()
              dispatch({ type: 'ACTIVE_CURRENT_STRIKE_INDEX', payload: index })
            }}
          >
            Strike Strategy
          </SelectStrikeStrategyButton>
        </Box>
        
      </Stack>
       
    </BaseShadowBox>
  )
}

const getOptionType = (id) => {
  switch (id) {
    case 0:
      return ['BC', '#000']
    case 1:
      return ['BP', '#000']
    case 3:
      return ['SC', '#000']
    case 4:
      return ['SP', '#000']
    default:
      return ['', '']
  }
}