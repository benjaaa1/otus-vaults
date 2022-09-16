import React, { useState } from "react";

import { Flex, Box, Stack, Text, useDisclosure, HStack } from '@chakra-ui/react';
import StrategyDetail from "./Detail/Strategy";
import VaultDetail from "./Detail/Vault";
import { HeaderInternalContainer, HeaderContainer, PageContainer, StrategyBox, VaultStrategyBox } from "../../Common/Container";
import { StrategyProvider, useStrategyContext } from "../../../context/StrategyContext";
import colors from "../../../designSystem/colors";
import { ArrowForwardIcon } from "@chakra-ui/icons";

import { HedgeStrategyModal } from "./Detail/StrategyModals/HedgeStrategyModal";
import { RoundStrategyModal } from "./Detail/StrategyModals/RoundStrategyModal";
import { StrikeStrategyModal } from "./Detail/StrategyModals/StrikeStrategyModal";
import { CreateButton, CTAButton, ViewLinkButton } from "../../Common/Button";
import { BaseHeaderText } from "../../../designSystem";
import theme from "../../../designSystem/theme";
import sizes from "../../../designSystem/sizes";

export default function Strategy() {

  const { isOpen: isHedgeStrategyModalOpen , onOpen: onHedgeStrategyOpen, onClose: onHedgeStrategyModalClose } = useDisclosure()
  const { isOpen: isStrategyModalOpen , onOpen: onStrategyOpen, onClose: onStrategyModalClose } = useDisclosure()
  const { isOpen: isStrikeStrategyModalOpen , onOpen: onStrikeStrategyOpen, onClose: onStrikeStrategyModalClose } = useDisclosure()

  const [step, setStep] = useState(0); 

  return <StrategyProvider>
        <StrategyHeader />
      <PageContainer>
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

      </PageContainer>
  </StrategyProvider>

}

const StrategyHeader = () => {

  const { strategyValue, viewVault } = useStrategyContext();

  const {
    vaultName,
    vaultDescription,
    vaultState,
    vaultParams
  } = strategyValue;
  console.log({ strategyValue })
  return (
    <HeaderContainer mt={'40px'} mb={'40px'} pb={'40px'}>
      <HeaderInternalContainer>
        <HStack spacing={6}>
          <Box flex={1}>
            <Box>
              <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                Vault & Strategy Manager
              </BaseHeaderText>
            </Box>
            <Box mt={6}>
              <HStack>
                <Box>
                  <BaseHeaderText fontWeight={'700'} color={colors.buttons.primary} size={theme.fontSize.lg} width="60%">
                  { vaultName }
                  </BaseHeaderText>
                </Box>
                <Box>
                  <ViewLinkButton onClick={viewVault} />
                </Box>
              </HStack>

            </Box>
            <Box>
              <BaseHeaderText fontWeight={'300'} color={colors.buttons.primary} size={theme.fontSize.md} width="60%">
                { vaultDescription }
              </BaseHeaderText>
            </Box>

            <Box mt={6} as='button' borderRadius='2px' bg='purple' color='white' px={4} h={8} fontWeight={'700'}>
              ETH
            </Box>

          </Box>
          <Box flex={1}>
            {/* <Box mt={2}>
              <BaseHeaderText fontWeight={'300'} color={colors.buttons.primary} size={theme.fontSize.sm} width="60%">
                { vaultDescription }
              </BaseHeaderText>
            </Box> */}
                    {/* <Box flex={1} p={2}>
          <ViewLinkButton onClick={viewVault} />
        </Box> */}

            {/* <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box>

            <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box>

            <Box>
              <CTAButton bg={colors.background.three}>
                Create a Vault
              </CTAButton>
            </Box> */}

          </Box>
        </HStack>
      </HeaderInternalContainer>
    </HeaderContainer>
  )
}

const MyVaultNav = ({ 
  onHedgeStrategyOpen,
  onStrategyOpen,
  onStrikeStrategyOpen,
  step, 
  setStep
}) => {

  return (
    <Stack borderRadius={'2px'}>
      <Box mb={10}>
        <Text fontFamily={ `'IBM Plex Sans', sans-serif`} cursor={'pointer'} p={2} color={colors.text.light} onClick={() => setStep(0)} fontWeight={step == 0 ? '700' : '400'} fontSize='sm'>{ step == 0 ? <ArrowForwardIcon /> : null } Current Round </Text>
        <Text fontFamily={ `'IBM Plex Sans', sans-serif`} cursor={'pointer'} p={2} color={colors.text.light} onClick={() => setStep(1)} fontWeight={step == 1 ? '700' : '400'} fontSize='sm'>{ step == 1 ? <ArrowForwardIcon /> : null } Vault History </Text>
      </Box>

      <Box mt={10}>
        <CreateButton m={1} width={'162px'} fontSize={'sm'} fontWeight={'400'} onClick={() => onStrategyOpen()}>
          Vault Strategy
        </CreateButton>
        <CreateButton m={1} width={'162px'} fontSize={'sm'} fontWeight={'400'} onClick={() => onStrikeStrategyOpen()}>
          Strike Strategies
        </CreateButton>
        <CreateButton m={1} width={'162px'} fontSize={'sm'} fontWeight={'400'} onClick={() => onHedgeStrategyOpen()}>
          Hedge Strategy
        </CreateButton>
      </Box>

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
    <StrategyBox ml="4" flex="7" p="4" mt="4" minHeight={'600px'}>
      <StrategyDetail />
    </StrategyBox>

    <Box flex="3" p="4" mt="4" ml="4" height={'600px'}>
      <VaultDetail />
    </Box>
  </>
}

const VaultHistory = () => {
  return <>
    <StrategyBox  ml="4" flex="7" p="4" mt="4" minHeight={'600px'}>
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