import React, { useState } from "react";

import {
  Text,
  Flex, 
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
} from '@chakra-ui/react';

import colors from "../../../designSystem/colors";
import { CreateButton, NextButton, PreviousButton } from "../../_Common/Button";
import { CreateVaultProvider, useCreateVaultContext } from "../../../context/CreateVaultContext";
import StartStep from "./StartStep";
import VaultStep from "./VaultStep";
import StrategyStep from "./StrategyStep";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import ReviewStep from "./ReviewStep";

export const CreateVaultModal = ({ isOpen, onClose }) => {

  // Name & Description 0

  // Vault Details 1

  // Strategy Settings 2

  // Review 3


  return (
    <>
    <CreateVaultProvider>
      <Modal borderRadius={'none'} size={'4xl'} closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius={'none'} background={colors.background.two} color={colors.text.light}>
          <ModalHeader>Create a Vault</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Flex>
              <Box flex={1} borderRight={`1px solid ${colors.borderLight}`} marginRight={2}>
                <CreateVaultSideGuide />
              </Box>
              <Box flex={4}>
                <CreateVaultStep />
              </Box>
            </Flex>
          </ModalBody>

          <CreateVaultModalFooter />
        </ModalContent>
      </Modal>
    </CreateVaultProvider>
    </>
  )
}

const CreateVaultSideGuide = () => {

  const { step } = useCreateVaultContext(); 

  return (
    <Stack>
      <Text fontWeight={step == 0 ? '700' : '400'} fontSize='xs'>{ step == 0 ? <ArrowForwardIcon /> : null } Name & Description</Text>
      <Text fontWeight={step == 1 ? '700' : '400'} fontSize='xs'>{ step == 1 ? <ArrowForwardIcon /> : null } Vault Details</Text>
      <Text fontWeight={step == 2 ? '700' : '400'} fontSize='xs'>{ step == 2 ? <ArrowForwardIcon /> : null } Strategy Settings</Text>
      <Text fontWeight={step == 3 ? '700' : '400'} fontSize='xs'>{ step == 3 ? <ArrowForwardIcon /> : null } Review</Text>
    </Stack>
  )
}

const CreateVaultStep = () => {

  const { step } = useCreateVaultContext(); 

  let comp; 
  switch (step) {
    case 0:
      comp = <StartStep />
      break;
    case 1:
      comp = <VaultStep />
      break;
    case 2:
      comp = <StrategyStep />
      break;
    case 3:
      comp = <ReviewStep />
      break;
    default:
      break;
  }

  return comp; 
}

const CreateVaultModalFooter = () => {

  const { loading, step, setStep, createVault } = useCreateVaultContext(); 
  
  return <ModalFooter>
    {
      step == 0 ? 
      <PreviousButton onClick={() => setStep(step + 1)}>
        Next
      </PreviousButton>
      : 
      <>
        <PreviousButton mr={3} onClick={() => setStep(step - 1)}>
          Previous
        </PreviousButton> 
        {
          step == 3 ? 
          <CreateButton isLoading={loading} onClick={createVault}>
            Create Vault
          </CreateButton> :
          <NextButton onClick={() => setStep(step + 1)}>
            Next
          </NextButton>
        }
      </>
    }
  </ModalFooter>
}

