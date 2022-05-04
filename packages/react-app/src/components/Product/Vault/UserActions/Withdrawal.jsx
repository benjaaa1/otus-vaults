import React, { useEffect, useState } from "react";
import { Button, InputNumber } from "antd";
import { ethers } from "ethers"; 

export const Withdrawal = ({ otusVaultContract, susdContract, address, signer }) => {

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
    <div>

      <InputNumber min={1} max={shares} defaultValue={shares} />

      <Button onClick={initiateWithdraw}>
        Withdrawal
      </Button> 
    </div>
  );
}


/**
 * OtusVault.sol
 */

// initiateWithdraw numofshares (shares(account))
// completeWithdraw
// (get numofshares from accountVaultBalance(account address))