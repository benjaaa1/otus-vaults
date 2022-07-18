import React from "react";

import {
  Flex, 
  Box,
  useDisclosure,
  Grid, 
  GridItem,
  Stack,
  Text,
  Center
} from '@chakra-ui/react';

import { Select } from "../../../Common/Select";
import { AddButton, SelectStrikeButton, ViewLinkButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext"
import { BaseShadowBox } from "../../../Common/Container";
import theme from "../../../../designSystem/theme";
import StrikesModal from "./StrikesModal";

export default function StrategyDetail() {

  const { state, dispatch, strategyAddress, strategyValue, viewVault, setSelectedBoard } = useStrategyContext();

  const {
    selectedBoard,
    liveBoards,
    currentStrikes,
    currentRoundStrikes
  } = state; 

  const { activeBoardId } = strategyValue;
  console.log({ activeBoardId, strategyValue })
  const { vaultState, activeExpiry } = strategyValue; 
  const {
    round,
    lockedAmount, 
    lockedAmountLeft,
    roundInProgress
  } = vaultState; 

  const { isOpen: isStrikeSelectModalOpen , onOpen: onStrikeSelectOpen, onClose: onStrikeSelectModalClose } = useDisclosure()

// active is more simple
// upcoming is this one

  return (
    <>
      <Flex border={'1px solid #333'} minWidth='max-content' alignItems='center' p={4} mb={4}>
        <Box flex={1} p={2}>

          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Vault Status</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{ roundInProgress ? 'In Progress' : 'Closed' }</Text>

        </Box>
        <Box flex={1} p={2}>

          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Current Expiry</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>{activeExpiry || 'N/A' }</Text>

        </Box>
        <Box flex={1} p={2}>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Capital Used</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>${ lockedAmount - lockedAmountLeft }</Text>
        </Box>

        <Box flex={1} p={2}>
          <Text fontSize='xs' fontWeight={'400'} fontFamily={`'IBM Plex Sans', sans-serif`}>Hedge Status</Text>
          <Text fontSize='xs' fontWeight={'700'} fontFamily={`'IBM Plex Mono', monospace`}>Not Available</Text>
        </Box>

        <Box flex={1} p={2}>
          <ViewLinkButton onClick={viewVault} />
        </Box>
      </Flex>

      <Flex minWidth='max-content' alignItems='center' p={4}>
        <Box flex={2} p={2}>
        {/* isDisabled={activeBoardId > 0} only disable if trades occurred */}
          <Select width="100%" id='market' id='board' placeholder={'Select Round Expiry'} value={activeBoardId} onChange={(e) => setSelectedBoard(e.target.value)}>
          {
            Object.values(liveBoards).map(({ name, id }) => (<option value={id}>{name}</option>))
          }
          </Select>
        </Box>
        <Box flex={1} p={2}>
          <AddButton disabled={activeBoardId > 0} width={'100%'} onClick={() => dispatch({ type: 'ADD_CURRENT_STRIKE' })}>Add Strike</AddButton>
        </Box>
      </Flex>

      <Grid templateColumns='repeat(4, 1fr)' gap={6}>


        {

          activeBoardId > 0 && currentRoundStrikes.length > 0 ? 
            currentRoundStrikes.map((cs, index) => {
              return (
                <GridItem w='100%' h='100%' mb='2'>
                  <RoundStrikeSummary 
                    cs={cs} 
                    index={index} 
                    strategyAddress={strategyAddress}
                  />
                </GridItem>
              )
            })
            :          
            currentStrikes.map((cs, index) => {
              return (
                <GridItem w='100%' h='100%' mb='2'>
                  <StrikeSummary 
                    cs={cs} 
                    index={index} 
                    dispatch={dispatch} 
                    onStrikeSelectOpen={onStrikeSelectOpen}
                    onStrikeSelectModalClose={onStrikeSelectModalClose}
                  />
                </GridItem>
              )
            }) 

        }

      </Grid>

      <StrikesModal isOpen={isStrikeSelectModalOpen} onClose={onStrikeSelectModalClose} />
    </>
  )

}

const RoundStrikeSummary = ({
  cs, 
  index,
  strategyAddress
}) => {
  return <BaseShadowBox padding={theme.padding.lg}  _hover={{ boxShadow: '2px 2px 2px #a8a8a8' }}>
    <Stack spacing={4}>
      <Box>
        <SelectStrikeButton>
          { `$${cs.strikePrice}` }
        </SelectStrikeButton>
      </Box>

      <Box>
        <Center bg={getOptionType( cs.optionType )[1]} color='white'>
          <Box as='span' fontWeight='bold' fontSize='xs'>
          { getOptionType( cs.optionType )[0] }
          </Box>
        </Center>
      </Box>

      <Box>
        <ViewLinkButton size='xs' onClick={() => window.location.href = `https://app.lyra.finance/position/eth/${cs.positionId}?see=${strategyAddress}` } />
      </Box>

    </Stack>
  </BaseShadowBox>
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
          <Center bg={getOptionType( cs.optionType )[1]} color='white'>
            <Box as='span' fontWeight='bold' fontSize='xs'>
            { getOptionType( cs.optionType )[0] }
            </Box>
          </Center>
        </Box>

        {
          cs._strike != null ? 
          <Box>
            <Center bg={cs.optionType == 0 || cs.optionType == 1 ? '#000' : '#84FFC4'} color={cs.optionType == 0 || cs.optionType == 1 ? '#fff' : '#000'}>
              <Box as='span' fontWeight='bold' fontSize='sm'>
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

      </Stack>
       
    </BaseShadowBox>
  )
}

const getOptionType = (id) => {
  switch (id) {
    case 0:
      return ['Buy Call', '#000']
    case 1:
      return ['Buy Put', '#000']
    case 3:
      return ['Sell Call', '#000']
    case 4:
      return ['Sell Put', '#000']
    default:
      return ['', '']
  }
}