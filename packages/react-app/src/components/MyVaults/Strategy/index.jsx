import React, { useState } from "react";

import { Flex, Box, Stack, Text, useDisclosure } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { StrategyBox, VaultStrategyBox } from "../../Common/Container";
import { StrategyProvider } from "../../../context/StrategyContext";
import colors from "../../../designSystem/colors";
import { ArrowForwardIcon } from "@chakra-ui/icons";

import { HedgeStrategyModal } from "./Detail/StrategyModals/HedgeStrategyModal";
import { RoundStrategyModal } from "./Detail/StrategyModals/RoundStrategyModal";
import { StrikeStrategyModal } from "./Detail/StrategyModals/StrikeStrategyModal";

export default function Strategy() {

  const { isOpen: isHedgeStrategyModalOpen , onOpen: onHedgeStrategyOpen, onClose: onHedgeStrategyModalClose } = useDisclosure()
  const { isOpen: isStrategyModalOpen , onOpen: onStrategyOpen, onClose: onStrategyModalClose } = useDisclosure()
  const { isOpen: isStrikeStrategyModalOpen , onOpen: onStrikeStrategyOpen, onClose: onStrikeStrategyModalClose } = useDisclosure()

  const [step, setStep] = useState(0); 

  return <StrategyProvider>
    <Flex>
      

        <Box flex={1} bg={colors.background.two} minWidth={'200px'} minHeight={'600px'} p={4} mt="4">
            <MyVaultNav
              onHedgeStrategyOpen={onHedgeStrategyOpen}
              onStrategyOpen={onStrategyOpen}
              onStrikeStrategyOpen={onStrikeStrategyOpen}
              step={step} 
              setStep={setStep} 
            />
        </Box>
        
        <MyVaultStrategy step={step} />

     
    </Flex>

    <HedgeStrategyModal isOpen={isHedgeStrategyModalOpen} onClose={onHedgeStrategyModalClose} />
    <RoundStrategyModal isOpen={isStrategyModalOpen} onClose={onStrategyModalClose} />
    <StrikeStrategyModal isOpen={isStrikeStrategyModalOpen} onClose={onStrikeStrategyModalClose} />

  </StrategyProvider>;

}

const MyVaultNav = ({ 
  onHedgeStrategyOpen,
  onStrategyOpen,
  onStrikeStrategyOpen,
  step, 
  setStep
}) => {

  return (
    <Stack>
      <Text color={colors.text.light} onClick={() => setStep(0)} fontWeight={step == 0 ? '700' : '400'} fontSize='sm'>{ step == 0 ? <ArrowForwardIcon /> : null } Current Round </Text>
      <Text color={colors.text.light} onClick={() => setStep(1)} fontWeight={step == 1 ? '700' : '400'} fontSize='sm'>{ step == 1 ? <ArrowForwardIcon /> : null } Vault History </Text>
      <Text color={colors.text.light} onClick={() => onStrategyOpen()} fontWeight={'700'} fontSize='sm'>Vault Strategy</Text>
      <Text color={colors.text.light} onClick={() => onStrikeStrategyOpen()} fontWeight={'700'} fontSize='sm'>Strike Strategy</Text>
      <Text color={colors.text.light} onClick={() => onHedgeStrategyOpen()} fontWeight={'700'} fontSize='sm'>Hedge Strategy</Text>
    </Stack>
  )
}

const MyVaultStrategy = ({ step }) => {

  let comp; 
  switch (step) {
    case 0:
      comp = <CurrentRound />
      break;
    case 1:
      comp = <VaultHistory />
      break;
    case 2:
      comp = <VaultSettings />
      break;
    default:
      break;
  }

  return comp; 
}

const CurrentRound = () => {
  return <>
    <StrategyBox flex="7" p="4" mt="4" minHeight={'600px'}>
      <StrategyDetail />
    </StrategyBox>

    <Box flex="3" p="4" mt="4" ml="4" height={'600px'}>
      <VaultDetail />
    </Box>
  </>
}

const VaultHistory = () => {
  return <>
    <StrategyBox flex="7" p="4" mt="4" minHeight={'600px'}>
      HistoryDetail
    </StrategyBox>
  </>
}

const VaultSettings = () => {
  return <>
    <StrategyBox flex="7" p="4" mt="4" minHeight={'600px'}>
      VaultSettings
    </StrategyBox>
  </>
}