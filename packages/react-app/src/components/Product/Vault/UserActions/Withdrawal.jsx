import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers"; 
import useWeb3 from "../../../../hooks/useWeb3";
import { BaseButton } from "../../../../designSystem";
import { Input, VStack } from '@chakra-ui/react'

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

  const withdrawSNXSUSD = async () => {
    try {
      const success = await otusVaultContract.connect(signer).withdrawSNXSUSD(); 
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
      <BaseButton width={'100%'} onClick={withdrawSNXSUSD}>
      withdrawSNXSUSD
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