import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers"; 
import useWeb3 from "../../../../hooks/useWeb3";
import { BaseButton } from "../../../../designSystem";
import { Input, InputGroup, InputLeftElement, InputRightElement, VStack } from '@chakra-ui/react'
import { WithdrawButton } from "../../../Common/Button";
import { CheckIcon } from '@chakra-ui/icons'; 

export const Withdraw = () => {

  const { vault } = useParams();

  const { address, signer, contracts } = useWeb3({ OtusVault: vault });

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";

  const [shares, setShares] = useState(0);

  useEffect(async () => {
    if(otusVaultContract) {
      try {
        const sharesBalance = await otusVaultContract.shares(address); 
        console.log({ sharesBalance:  ethers.utils.formatEther(sharesBalance) }); 
        setShares( ethers.utils.formatEther(sharesBalance) );
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVaultContract])


  const initiateWithdraw = async () => {
    try {
      const success = await otusVaultContract.connect(signer).initiateWithdraw(0); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <VStack>
      <InputGroup>
        <InputLeftElement
          pointerEvents='none'
          color='gray.300'
          fontSize='1.2em'
          children='$'
        />
        <Input color='white' min={1} max={shares} defaultValue={shares} />
        <InputRightElement children={<CheckIcon color='green.500' />} />
      </InputGroup>

      <WithdrawButton width={'100%'} onClick={initiateWithdraw}>
        Withdraw
      </WithdrawButton> 
    </VStack>
  );
}