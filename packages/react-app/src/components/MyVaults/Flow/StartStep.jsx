import React from "react";

import { Flex, Stack, FormControl, FormLabel, Box, Input, Textarea } from '@chakra-ui/react'
import { useCreateVaultContext } from "../../../context/CreateVaultContext";
import colors from "../../../designSystem/colors";

const StartStep = () => {

  const { state, updateVaultInformation } = useCreateVaultContext(); 

  const { vaultInformation } = state; 

  const { name, description, tokenName } = vaultInformation; 

  return (
      <Box p={6}>
        <Stack spacing={6}>
          <Flex>
            <Box flex={1}>
              <FormControl>
                <FormLabel fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff" htmlFor='market'>Name</FormLabel>
                <Input value={name} placeholder='Vault Name' bg={colors.background.two}  onChange={(e) => updateVaultInformation('name', e.target.value)} />
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <FormLabel fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff" htmlFor='market'>Token Name</FormLabel>
                <Input value={tokenName} placeholder='Vault Token Name' bg={colors.background.two}  onChange={(e) => updateVaultInformation('tokenName', e.target.value)} />
              </FormControl>
            </Box>
          </Flex>

          <Flex>
            <Box flex={1}>
              <FormControl>
                <FormLabel fontWeight={'700'} fontSize={'12px'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff" htmlFor='market'>Description</FormLabel>
                <Textarea size={'sm'} value={description} placeholder='Vault Description' bg={colors.background.two}  onChange={(e) => updateVaultInformation('description', e.target.value)} />
              </FormControl>
            </Box>
          </Flex>

        </Stack>
      </Box>

  )
}

export default StartStep;
