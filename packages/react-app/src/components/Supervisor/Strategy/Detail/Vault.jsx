import React from "react";

import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { ArrowForwardIcon } from "@chakra-ui/icons";

import { Button } from "../../../Common/Button";
import { useStrategyContext } from "../../../../context/StrategyContext";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";

export default function VaultDetail() {

  const { 
    strategyValue,
    state, 
    dispatch, 
    setStrategyOnVault,
    startRound,
    closeRound
  } = useStrategyContext();
  
  const history = useHistory();

  const { vault } = useParams();

  // const { contracts, signer } = useWeb3({ OtusVault: vault } );

  // const otusVault = contracts ? contracts['OtusVault'] : "";

  // const [asset, setAsset] = useState('');
  // const [tokenName, setTokenName] = useState(''); 
  // const [vaultType, setVaultType] = useState(''); 
  // const [cap, setCap] = useState(''); 

  // useEffect(async () => {
  //   if(otusVault) {
  //     try {
  //       const roundPremiumCollected = await otusVault.roundPremiumCollected();

  //       const response = await otusVault.optionType(); 
  //       console.log({ response: formatUnits(response) })
  //       const vaultParams = await otusVault.vaultParams(); 
  //       console.log({ vaultParams })
  //       setCap(formatUnits(vaultParams.cap, vaultParams.decimal));
  //       const vaultState = await otusVault.vaultState(); 
  //       console.log({ vaultState })

  //       console.log({
  //         round: formatUnits(vaultState.round, 18),
  //         lockedAmount: formatUnits(vaultState.lockedAmount),
  //         lastLockedAmount: formatUnits(vaultState.lastLockedAmount),
  //         totalPending: formatUnits(vaultState.totalPending),
  //         queuedWithdrawShares: formatUnits(vaultState.queuedWithdrawShares),
  //         nextRoundReadyTimestamp: formatUnits(vaultState.nextRoundReadyTimestamp),
  //         roundInProgress: vaultState.roundInProgress
  //       })

  //     } catch (error) {
  //       console.log({ error })
  //     }
  //   }
  // }, [otusVault])
  console.log("strategyValue", strategyValue); 

  return (
    <Box p='4'>
      <VStack>
        <Button onClick={() => history.push(`/vault/${vault}`)}>View Vault Page</Button>

        {
          strategyValue.hasStrategy ? 
          <>
            {
              strategyValue.vaultState.roundInProgress ? 
              <Button onClick={closeRound} rightIcon={<ArrowForwardIcon />}>Close Round</Button> :
              <Button onClick={startRound} rightIcon={<ArrowForwardIcon />}>Start Round</Button>
            }
          </> :
          <>
          <Button onClick={setStrategyOnVault} rightIcon={<ArrowForwardIcon />}>Set Strategy on Vault</Button>
          </>

        }
        
      </VStack> 
    </Box> 
  );
}