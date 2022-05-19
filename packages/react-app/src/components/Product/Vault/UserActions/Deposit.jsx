import React, { useEffect, useState } from "react";
import { Button, InputNumber } from "antd";
import { useParams } from "react-router-dom";
import { ethers } from "ethers"; 
import { BaseShadowBox } from "../../../Common/Container";
import { Flex } from 'reflexbox';
import { BaseButton } from "../../../../designSystem";
import { Input, InputGroup, InputLeftElement, InputRightElement } from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'; 
import { parseEther, parseUnits, formatUnits } from '@ethersproject/units';

export const Deposit = ({ l2DepositMover, usdcContract2, usdcContract, l1bridge, otusVaultContract, susdContract, address, signer }) => {

  const { vault } = useParams();

  const [amount, setAmount] = useState(590); 
  const [allowanceAmount, setAllowanceAmount] = useState(0); 

  const onChange = async (val) => {
    const vaultParams = await otusVaultContract.vaultParams(); 
    console.log({ vaultParams })
    console.log({ val })
    setAmount(val); 
  }

  useEffect(async () => {
    if(otusVaultContract) {
      try {
        const boardId = await otusVaultContract.boardId();
        console.log({ boardId: boardId, formattedBoardId: formatUnits(boardId) })
        const response = await otusVaultContract.getBoard();
        console.log({ response }); 
      } catch (error) {
        console.log({error})
      }
    }
  }, [otusVaultContract])

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
  }, [susdContract]);

  const depositFromL1 = async () => {
    try {

      const c = await l1bridge.connect(signer).hopAmm();
      console.log({ c });
      console.log({ amount: parseUnits(amount.toString()) })
      const success = await l1bridge.connect(signer).deposit(
        "0x7169Ff397F5525F0ED3691a9575D892B4745E9f3",
        "0xEB27E1c0a5107d8c231B9a742d77c5aa26aA8506",
        parseUnits(amount.toString()),
        0,
        "0xA46d09fd4B7961aE16D33122660f43726cB1Ff36",
        parseUnits('.99'),
        parseUnits('69')
      ); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  const approveFromL1 = async () => {
    try {
      // need to check erc20 address
      const success = await usdcContract.connect(signer).approve(l1bridge.address, parseUnits(amount.toString()) ); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  // 0xd1f7685D8559AaD3D64acF9BaB90Ef977c5F286D
  const count = async () => {
    try {

      //0x3b8e53B3aB8E01Fb57D0c9E893bC4d655AA67d84
      const balance2 = await usdcContract2.balanceOf("0xEB27E1c0a5107d8c231B9a742d77c5aa26aA8506");
      console.log({ balance2: formatUnits(balance2) })
      const c2 = await l2DepositMover.connect(signer).getUserBalance();
      console.log({ c2: formatUnits(c2) });
    } catch (error)  {
      console.log(error)
    }
  }

  const deposit = async () => {
    try {
      // const roundPremiumSUSD = parseUnits('50');
      // console.log({ roundPremiumSUSD })
      console.log({ amount })
      const success = await otusVaultContract.connect(signer).deposit(parseUnits(amount.toString())); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  const approve = async () => {
    try {
      // need to check erc20 address
      const balance = await susdContract.balanceOf(address); 
      console.log({ balance: ethers.utils.formatEther(balance) })
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log({ formattedBalance: formattedBalance })
      const success = await susdContract.connect(signer).approve(vault, ethers.utils.parseEther(formattedBalance)); 
      console.log({ success })
    } catch (error) {
      console.log(error)
    }
  }

  // 0x615a6784b419d914eD17c853e5E28F0910310d32 vault 
  return (
    <BaseShadowBox padding={0}>
      <Flex>

        { /** Need to approve allowance first check first then approve then deposit */}

        {
          parseInt(allowanceAmount) > 0 ? 
          [
            <InputGroup>
              <InputLeftElement
                pointerEvents='none'
                color='gray.300'
                fontSize='1.2em'
                children='$'
              />
                <Input placeholder='Enter amount' onChange={(event) => onChange(event.target.value)} />
              <InputRightElement children={<CheckIcon color='green.500' />} />
            </InputGroup>,
            <BaseButton onClick={deposit}>
              Deposit
            </BaseButton>,
            <BaseButton onClick={depositFromL1}>
              Deposit From L1
            </BaseButton>
          ] : 
          <>
          <BaseButton onClick={depositFromL1}>
          Deposit From L1
        </BaseButton>
        <BaseButton onClick={approveFromL1}>
          Approve From L1
        </BaseButton>
        <BaseButton onClick={count}>
          Get From L2
        </BaseButton>
          <BaseButton onClick={approve}>
            approve
          </BaseButton> 
          </>
        }

      </Flex>
    </BaseShadowBox>
  );
}


/**
 * OtusVault.sol
 */

// deposit vaultParams.asset
// 