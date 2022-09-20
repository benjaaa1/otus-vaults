import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useWeb3 from "../../../../hooks/useWeb3";

import { ethers } from "ethers"; 
import { parseUnits, formatUnits } from '@ethersproject/units';

import { Input, InputGroup, InputLeftElement, InputRightElement, VStack, Text, Flex, Box, Center } from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'; 
import { ApproveButton, DepositButton } from "../../../_Common/Button";

export const Deposit = () => {

  const { vault } = useParams();

  const { address, signer, contracts } = useWeb3({ OtusVault: vault, L2DepositMover: "0xEB27E1c0a5107d8c231B9a742d77c5aa26aA8506" }, {});

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";
  const susdContract = contracts ? contracts['SUSD'] : "";

  const [amount, setAmount] = useState(0); 
  const [balance, setBalance] = useState(0); 
  const [allowanceAmount, setAllowanceAmount] = useState(0); 
  const [loading, setLoading] = useState(false); 

  const onChange = async (val) => {
    setAmount(val); 
  }

  useEffect(async () => {
    if(susdContract) {
      try {

        const balance = await susdContract.balanceOf(address);
        console.log({ balance }); 
        setBalance(ethers.utils.formatEther(balance))
        
      } catch (error) {
        console.log({error})
      }
    }
  }, [susdContract])

  const checkAllowanceStatus = async () => {
    const allowanceStatus = await susdContract.allowance(address, vault); 
    console.log({ allowanceStatus:  ethers.utils.formatEther(allowanceStatus) }); 
    setAllowanceAmount( ethers.utils.formatEther(allowanceStatus) );
  }

  useEffect(async () => {
    if(susdContract && otusVaultContract) {
      try {
        await checkAllowanceStatus(); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [susdContract]);

  const deposit = async () => {
    try {
      setLoading(true); 
      console.log({ amount })
      const success = await otusVaultContract.connect(signer).deposit(parseUnits(amount.toString())); 
      const successReceipt = success.wait(); 
      console.log({ successReceipt });
    } catch (error) {
      console.log(error)
    }
    setLoading(false); 

  }
  
  const approve = async () => {
    try {
      setLoading(true); 
      const balance = await susdContract.balanceOf(address); 
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log({ formattedBalance: formattedBalance })
      const success = await susdContract.connect(signer).approve(vault, ethers.utils.parseEther(formattedBalance)); 
      const successReceipt = success.wait(); 
      console.log({ successReceipt })
      await checkAllowanceStatus();
    } catch (error) {
      console.log(error)
    }
    setLoading(false); 
  }

  return (
      <VStack spacing={4}>
        <InputGroup>
          <InputLeftElement
            pointerEvents='none'
            color='gray.300'
            fontSize='1.2em'
            children='$'
          />
            <Input disabled={parseInt(allowanceAmount) <= 0} color='white' placeholder='Enter amount' onChange={(event) => onChange(event.target.value)} />
          <InputRightElement children={<CheckIcon color='green.500' />} />
        </InputGroup>
        <Flex width={'100%'} mb={4} alignContent={'space-between'}>
          <Box flex={1}>
            <Text fontWeight={'400'} float={'left'} fontSize={'xs'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff">
              Wallet Balance
            </Text>
          </Box>
          <Box flex={1}>
            <Text fontWeight={'400'} float={'right'} fontSize={'xs'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff">
              { balance }
            </Text>
          </Box>
        </Flex>
        {
          parseInt(allowanceAmount) > 0 ? 
          <>
            <DepositButton width={'100%'} onClick={deposit} isLoading={loading}>
              Deposit
            </DepositButton>
          </> : 
          <>
            <ApproveButton width={'100%'} onClick={approve} isLoading={loading}>
              Approve
            </ApproveButton> 
          </>
        }
        <Center>
          <Text align={'center'} fontWeight={'400'} fontSize={'xs'} fontFamily={`'IBM Plex Mono', monospace`} color="#fff">
            Your deposit will be deployed in the Vault’s weekly strategy on Friday at 11am UTC
          </Text>
        </Center>
      </VStack>
  );
}