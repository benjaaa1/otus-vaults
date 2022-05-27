import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { formatUnits } from "ethers/lib/utils";
import useWeb3 from "../../../../hooks/useWeb3";

import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { ArrowForwardIcon } from "@chakra-ui/icons";

import { Button } from "../../../Common/Button";

export default function VaultDetail({ strategyAddress }) {

  const history = useHistory();

  const { vault } = useParams();

  const { contracts, signer } = useWeb3({ OtusVault: vault } );

  const otusVault = contracts ? contracts['OtusVault'] : "";

  const [asset, setAsset] = useState('');
  const [tokenName, setTokenName] = useState(''); 
  const [vaultType, setVaultType] = useState(''); 
  const [cap, setCap] = useState(''); 

  useEffect(async () => {
    if(otusVault) {
      try {
        const roundPremiumCollected = await otusVault.roundPremiumCollected();

        const response = await otusVault.optionType(); 
        console.log({ response: formatUnits(response) })
        const vaultParams = await otusVault.vaultParams(); 
        console.log({ vaultParams })
        setCap(formatUnits(vaultParams.cap, vaultParams.decimal));
        const vaultState = await otusVault.vaultState(); 
        console.log({ vaultState })

        console.log({
          round: formatUnits(vaultState.round, 18),
          lockedAmount: formatUnits(vaultState.lockedAmount),
          lastLockedAmount: formatUnits(vaultState.lastLockedAmount),
          totalPending: formatUnits(vaultState.totalPending),
          queuedWithdrawShares: formatUnits(vaultState.queuedWithdrawShares),
          nextRoundReadyTimestamp: formatUnits(vaultState.nextRoundReadyTimestamp),
          roundInProgress: vaultState.roundInProgress
        })

      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVault])

  const setStrategyOnVault = async () => {
    try {
      const response = await otusVault.connect(signer).setStrategy(strategyAddress); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <Box p='4'>
      <VStack>
        <Button onClick={() => history.push(`/vault/${vault}`)}>View Vault Page</Button>

        <HStack>
          <Text p={2}>Token Name</Text>
          <Text p={2}></Text>
        </HStack>

        <HStack>
          <Text p={2}>Token Symbol</Text>
          <Text p={2}></Text>
        </HStack>

        <HStack>
          <Text p={2}>Balance</Text>
          <Text p={2}></Text>
        </HStack>

        <HStack>
          <Text p={2}>Max Cap</Text>
          <Text p={2}>${cap}</Text>
        </HStack>

        <Button onClick={setStrategyOnVault} rightIcon={<ArrowForwardIcon />}>Set Strategy on Vault</Button>
      </VStack> 
    </Box> 
  );
}