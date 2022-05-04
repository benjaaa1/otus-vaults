import React, { useEffect, useState } from "react";
import { Button, InputNumber } from "antd";
import { useParams } from "react-router-dom";
import { ethers } from "ethers"; 

export const Deposit = ({ otusVaultContract, susdContract, address, signer }) => {

  const { vault } = useParams();

  const [amount, setAmount] = useState(0); 
  const [allowanceAmount, setAllowanceAmount] = useState(0); 

  const onChange = (val) => {
    setAmount(val); 
  }

  useEffect(async () => {
    if(susdContract && otusVaultContract) {
      try {
        const allowanceStatus = await susdContract.allowance(address, vault); 
        console.log({ allowanceStatus:  ethers.utils.formatEther(allowanceStatus) }); 
        setAllowanceAmount( ethers.utils.formatEther(allowanceStatus) );

        const accountVaultBalance = await otusVaultContract.accountVaultBalance(address); 
        console.log({ accountVaultBalance:  ethers.utils.formatEther(accountVaultBalance) }); 

        const totalBalance = await otusVaultContract.totalBalance(); 
        console.log({ totalBalance:  ethers.utils.formatEther(totalBalance) }); 

        const totalSupply = await otusVaultContract.totalSupply(); 
        console.log({ totalSupply:  ethers.utils.formatEther(totalSupply) }); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [susdContract])

  const deposit = async () => {
    try {
      const success = await otusVaultContract.connect(signer).deposit(ethers.utils.parseUnits(amount.toString(), 18)); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  const increaseAllowance = async () => {
    try {
      // need to check erc20 address
      const balance = await susdContract.balanceOf(address); 
      console.log({ balance: ethers.utils.formatEther(balance) })
      const formattedBalance = ethers.utils.formatEther(balance);
      const success = await susdContract.connect(signer).increaseAllowance(vault, ethers.utils.parseEther(formattedBalance)); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <InputNumber min={1} max={1000} defaultValue={3} onChange={onChange} />
      { /** Need to approve allowance first check first then approve then deposit */}

      {
        parseInt(allowanceAmount) > 0 ? 
        <Button onClick={deposit}>
          Deposit
        </Button> : 
        <Button onClick={increaseAllowance}>
          Increase Allowance
        </Button> 
      }

    </div>
  );
}


/**
 * OtusVault.sol
 */

// deposit vaultParams.asset
// 