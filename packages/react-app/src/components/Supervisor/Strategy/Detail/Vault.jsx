import React from "react";

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
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { Slider } from "../../../Common/Slider";

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
    closeRound,
    reducePosition,
    _hedge
  } = useStrategyContext();
  
  const history = useHistory();

  const { vault } = useParams();

  const { isOpen, onOpen, onClose } = useDisclosure()


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
        <Button onClick={reducePosition}>Reduce Position</Button>
        <Button onClick={() => {  onOpen() }}>Set Hedge Strategy</Button>
        <Button onClick={_hedge}>Hedge</Button>

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
            <Button colorScheme='gray' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='blue' mr={3} onClick={setHedgeStrategy}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}