import React, { useEffect } from "react";

import { useContractLoader } from "eth-hooks";
import { Button } from "../../../Common/Button";
import { useState } from "react";
import { 
  Flex, 
  Center
} from '@chakra-ui/react';

import { ArrowForwardIcon } from "@chakra-ui/icons";
import { parseEther, parseUnit, parseUnits } from '@ethersproject/units';
import { formatUnits } from "ethers/lib/utils";

export default function Action({ otusVault, strategy, signer, board, strikeSelected, setStrategy }) {

  const toBN = (val) => {
    return parseUnits(val, 18);
  }

  const [disable, setDisable] = useState({
    hasStrategyVault: true,
    hasNextStrikes: true,
    canStartNextRound: true,
    canTrade: true,
    canCloseRound: true
  });

  useEffect(async () => {
    if(otusVault) {
      try {
        const strategy = await otusVault._strategy(); // hasStrategyVault - not 0 address

      } catch (error) {
        console.log({ error })
      }
    }
  })

  const setNextBoardStrikeId = async () => {
    console.log({ board, strikeSelected })
    try {
      // const response = await otusVault.connect(signer).setNextBoardStrikeId(parseUnits(board.id.toString()), parseUnits(strikeSelected.id.toString())); 
      const response = await otusVault.connect(signer).setNextBoardStrikeId(board.id, strikeSelected.id); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const startNextRound = async () => {
    try {
      const response = await otusVault.connect(signer).startNextRound(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const trade = async () => {
    try {
      // const optionType = await strategy.vaultOptionTypes(3);
      // console.log({ optionType })

      // const strikeId = await otusVault.strikeId();
      // console.log({ strikeId })

      // const strikeId = await otusVault.strikeId();
      // console.log({ strikeId })

      const response = await otusVault.connect(signer).trade(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const getBoard = async () => {
    try {
      const boardId = await otusVault.boardId();
      console.log({ boardId, board, strikeSelected })

      const board2 = await otusVault.getBoard();
      console.log({ board2, boardId: formatUnits(board2[0])})

      const val = await strategy.isValidStrike2(strikeSelected.id); 
      console.log({ val })
      
      console.group({
        activeExpiry: formatUnits(val[0]),
        callDelta: formatUnits(val[1]),
        maxDeltaGap: formatUnits(val[2]),
        deltaGap: formatUnits(val[3]),
        vol: formatUnits(val[4]),
        isValid: val[5]
      })

      const col = await strategy.getCollateral(strikeSelected.id); 
      console.log({ col, colFormat1: formatUnits(col[0]), colFormat2: formatUnits(col[1]), colFormat3: formatUnits(col[2]) })

      const _isCall = await strategy._isCall(); 
      console.log({ _isCall })

      const collateralAsset = await strategy.collateralAsset(); 
      console.log({ collateralAsset })
      console.log({ address: otusVault.address })

      const roundPremiumCollected = await otusVault.roundPremiumCollected();
      console.log({ roundPremiumCollected: formatUnits(roundPremiumCollected)})

    } catch (error) {
      console.log({ error })
    }
  }

  const closeRound = async () => {
    try {
      const response = await otusVault.connect(signer).closeRound(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  return (
      <Flex sx={{ borderTop: "1px solid #9E9E9E", padding: "4px" }}>
      <Center flex='1' p={4}>
          <Button onClick={getBoard} rightIcon={<ArrowForwardIcon />}>getBoard</Button>
        </Center>
        <Center flex='1' p={4}>
          <Button isDisabled={!disable.hasNextStrikes} onClick={setNextBoardStrikeId} rightIcon={<ArrowForwardIcon />}>Set Strikes</Button>
        </Center>
        <Center flex='1' p={4}>
          <Button onClick={setStrategy} rightIcon={<ArrowForwardIcon />}>Set Strategy</Button>
        </Center>
        <Center flex='1' p={4}>
          <Button isDisabled={!disable.canStartNextRound} onClick={startNextRound} rightIcon={<ArrowForwardIcon />}>Start Next Round</Button>
        </Center>
        <Center flex='1' p={4}>
          <Button isDisabled={!disable.canTrade} onClick={trade} rightIcon={<ArrowForwardIcon />}>Trade</Button>
        </Center>
        <Center flex='1' p={4}>
          <Button isDisabled={!disable.canCloseRound} onClick={closeRound} rightIcon={<ArrowForwardIcon />}>Close Round</Button>
        </Center>
      </Flex>
  );
}


        // {/* <Box flex='1' p={4}>
        //   <Button onClick={getL2DepositMoverAddress}>getL2DepositMoverAddress</Button>
        // </Box> */}
        // {/* <Box flex='1' p={4}>
        //   <Button onClick={allowL1Deposits}>Accept L1 Deposits</Button>
        // </Box> */}

          
  // const getL2DepositMoverAddress = async () => {
  //   try {
  //     const bridge = await otusCloneFactory.connect(signer).vaultBridge(otusVault.address); 
  //     console.log({ bridge });
  //   } catch (error) {
  //     console.log({ error });
  //   }
  // }

  // const allowL1Deposits = async () => {
  //   try {
  //     console.log({ vaultAddress: otusVault.address, otusCloneFactory })
  //     const response = await otusCloneFactory.connect(signer)._cloneL2DepositMover(otusVault.address); 
  //     console.log({ response })
  //   } catch (error) {
  //     console.log({ error })
  //   }
  // }