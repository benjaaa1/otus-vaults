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
  Flex
} from '@chakra-ui/react';
import { Slider } from "../../../Common/Slider";

import { CancelButton, SaveButton, VaultActionButton } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext";
import { SupervisorChart } from "../../../Chart/SupervisorChart";
import { VaultStrategyBox } from "../../../Common/Container";
import { data } from "../../../../utils/pnlChart";
import { StrikesSelected } from "./StrikesSelected";
import { TradeDetails } from "./TradeDetails";
import { CostDetails } from "./CostDetails";

export default function VaultDetail() {

  const { 
    strategyValue,
    state, 
    dispatch, 
    trade,
    startRound,
    closeRound
  } = useStrategyContext();

  const { currentStrikes, size } = state; 
  const { currentPrice } = strategyValue; 

  const [chartData, setChartData] = useState([]);
  const [transactionData, setTransactionData] = useState({
    maxCost: 0,
    minReceived: 0,
    maxLoss: 0,
    breakEvent: 0,
    total: 0
  });

  useEffect(async () => {
    console.log({ size })
    const [_chartData, _transactionData] = await data(currentStrikes, parseInt(size || 1)); 
    setChartData(_chartData); 
    setTransactionData(_transactionData); 

  }, [currentStrikes, size])

  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Box>
      <VStack>

        {
          strategyValue.vaultState.roundInProgress ? 
          <>
            <VaultActionButton onClick={closeRound}>Close Round</VaultActionButton>
            {/* <VaultActionButton onClick={closeRound}>Activate Hedge Strategy</VaultActionButton> */}
          </> :
          <>
            <VaultActionButton onClick={startRound}>Start Round</VaultActionButton>
          </>
        }

        <VaultStrategyBox>
          <StrikesSelected />
          <TradeDetails />
          {/* <CollateralDetails /> */}
          <SupervisorChart data={chartData} currentPrice={currentPrice} />
          <CostDetails transactionData={transactionData} />
        </VaultStrategyBox>

        <VaultActionButton onClick={trade}>Trade</VaultActionButton> 
        
      </VStack> 

      <HedgeStrategyModal isOpen={isOpen} onClose={onClose} dispatch={dispatch} />
      {/* <RoundStrategyModal isOpen={isOpen} onClose={onClose} dispatch={dispatch} /> */}

    </Box> 
  );
}

const HedgeStrategyModal = ({ isOpen, onClose }) => {

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
                <Slider name={"Hedge Percentage"} step={.1} min={-1} max={1} id={"hedgePercentage"} setSliderValue={setValue} sliderValue={hedgePercentage} label={'%'} />    
                <Slider name={"Max Hedge Attempts"} step={.05} min={0} max={.5} id={"maxHedgeAttempts"} setSliderValue={setValue} sliderValue={maxHedgeAttempts} label={''} />
                {/* <Slider name={"Strike Price Limit"} step={.1} min={0} max={1} id={"limitStrikePricePercent"} setSliderValue={setValue} sliderValue={limitStrikePricePercent} label={'%'} /> */}
                <Slider name={"Leverage Size"} step={.1} min={0} max={2} id={"leverageSize"} setSliderValue={setValue} sliderValue={leverageSize} label={''} />
                <Slider name={"Stop Loss Limit"} step={.1} min={0} max={2} id={"stopLossLimit"} setSliderValue={setValue} sliderValue={stopLossLimit} label={'%'} />
                <Slider name={"Hedge Direction"} step={.1} min={0} max={2} id={"isLongHedge"} setSliderValue={setValue} sliderValue={stopLossLimit} label={'%'} />
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