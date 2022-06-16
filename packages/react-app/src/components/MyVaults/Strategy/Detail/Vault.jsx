import React, { useEffect, useState } from "react";

import { 
  Box, 
  HStack, 
  VStack, 
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex ,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
} from '@chakra-ui/react';
import { Slider } from "../../../Common/Slider";

import { CancelButton, SaveButton, VaultActionButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext";
import { SupervisorChart } from "../../../Chart/SupervisorChart";
import { VaultStrategyBox } from "../../../Common/Container";
import { data } from "../../../../utils/pnlChart";

export default function VaultDetail() {

  const { 
    strategyValue,
    state, 
    dispatch, 
    trade,
    startRound,
    closeRound,
    reducePosition,
    _hedge,
    setVaultStrategy
  } = useStrategyContext();

  const { currentStrikes } = state; 

  const [chartData, setChartData] = useState([]);

  useEffect(async () => {
    if(currentStrikes.length > 0) {
      const cd = await data(currentStrikes); 
      console.log({ cd })
      setChartData(cd); 

      // const cd2 = await Promise.resolve()
    }
  }, [currentStrikes])

  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box>
      <VStack>

        {
          strategyValue.vaultState.roundInProgress ? 
          <>
            <VaultActionButton onClick={closeRound}>Close Round</VaultActionButton>
            <VaultActionButton onClick={trade}>Trade</VaultActionButton> 
          </> :
          <>
            <VaultActionButton onClick={setVaultStrategy}>Set Round Strategy</VaultActionButton>
            <VaultActionButton onClick={startRound}>Start Round</VaultActionButton>
          </>
        }

        {/* <MenuItem onClick={reducePosition}>Reduce Position</MenuItem>
                <MenuItem onClick={() => {  onOpen() }}>Set Hedge Strategy</MenuItem>
                <MenuItem onClick={_hedge}>Hedge</MenuItem> */}

        <VaultStrategyBox>
          {/* <SupervisorChart data={chartData} /> */}
        </VaultStrategyBox>
        
      </VStack> 

      <HedgeStrategyModal isOpen={isOpen} onClose={onClose} dispatch={dispatch} />

    </Box> 
  );
}


const HedgeStrategyModal = ({ isOpen, onClose }) => {

  const { state, dispatch, setHedgeStrategy } = useStrategyContext();

  const { hedgeStrategy } = state; 

  const { 
    hedgePercentage,
    maxHedgeAttempts,
    limitStrikePricePercent,
    leverageSize,
    stopLossLimit
  } = hedgeStrategy;

  console.log({ 
    hedgePercentage,
    maxHedgeAttempts,
    limitStrikePricePercent,
    leverageSize,
    stopLossLimit
  });

  const setValue = (id, value) => {
    dispatch({ type: 'UPDATE_HEDGE_STRATEGY', field: id, payload: value, })
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
                <Slider name={"Hedge Percentage"} step={.1} min={-1} max={1} id={"targetDelta"} setSliderValue={setValue} sliderValue={hedgePercentage} label={'%'} />    
                <Slider name={"Max Hedge Attempts"} step={.05} min={0} max={.5} id={"maxDeltaGap"} setSliderValue={setValue} sliderValue={maxHedgeAttempts} label={''} />
                <Slider name={"Strike Price Limit"} step={.1} min={0} max={1} id={"maxVolVariance"} setSliderValue={setValue} sliderValue={limitStrikePricePercent} label={'%'} />
                <Slider name={"Leverage Size"} step={.1} min={0} max={2} id={"minVol"} setSliderValue={setValue} sliderValue={leverageSize} label={''} />
                <Slider name={"Stop Loss Limit"} step={.1} min={0} max={2} id={"maxVol"} setSliderValue={setValue} sliderValue={stopLossLimit} label={'%'} />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <CancelButton mr={3} onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton mr={3} onClick={setHedgeStrategy}>
              Save
            </SaveButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}