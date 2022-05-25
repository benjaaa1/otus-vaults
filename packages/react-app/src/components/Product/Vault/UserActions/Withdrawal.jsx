import React, { useEffect, useState } from "react";
import { BaseButton } from "../../../../designSystem";
import { Box, Input, VStack } from '@chakra-ui/react'
import { ethers } from "ethers"; 
import useWeb3 from "../../../../hooks/useWeb3";
import { useParams } from "react-router-dom";

export const Withdrawal = () => {

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
      <Input color='white' min={1} max={shares} defaultValue={shares} />
      <BaseButton width={'100%'} onClick={initiateWithdraw}>
        Withdrawal
      </BaseButton> 
    </VStack>
  );
}


/**
 * OtusVault.sol
 */

// initiateWithdraw numofshares (shares(account))
// completeWithdraw
// (get numofshares from accountVaultBalance(account address))