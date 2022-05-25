import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

import { getLyraMarkets } from "../../../graphql";

import { Heading, Text, FormControl, FormLabel, Slider, Switch, Box, Center  } from '@chakra-ui/react'
import { Button } from "../../Common/Button"; 
import { Select } from "../../Common/Select"; 
import { BaseShadowBox } from "../../Common/Container";

const VaultFlow = ({ otusCloneFactory, signer }) => {

  const [vault, setVault] = useState(); 
  const [markets, setMarkets] = useState([]); 

  const [vaultDetails, setVaultDetails] = useState({
    _quoteAsset: '', 
    _baseAsset: '', 
    _tokenName: 'Otus', 
    _tokenSymbol: 'OTV',
    _isPublic: true, 
    _vaultType: 4, 
    _vaultParams: {
      decimals: 18,
      cap: ethers.utils.parseEther('500000'), // 500,000 usd cap
      asset: '' // susd 
    }
  });

  useEffect(async () => {
    
    if(otusCloneFactory) {
      try {
        const {markets} = await getLyraMarkets(); 
        console.log({ markets }); 
        setMarkets(markets);;
      } catch (e) {
        console.log(e)
      }
    }
  }, []); 

  const createVaultWithStrategy = async () => {

    try {
      const {
        _optionMarket,
        _baseAsset,
        _tokenName,
        _tokenSymbol,
        _isPublic,
        _vaultType,
        _vaultParams
      } = vaultDetails; 
      const response = await otusCloneFactory.connect(signer).cloneVaultWithStrategy(
        _optionMarket, 
        _tokenName, 
        _tokenSymbol,
        _isPublic, 
        _vaultType, 
        _vaultParams
      ); 
      console.log({ response }); 
      setVault(response); 
    } catch (e) {
      console.log(e); 
    }
  };

  const onChangePublic = () => {

  }

  const onSelectMarket = (selectedId) => {
    const { name, id, baseAddress, quoteAddress } = markets.find(({ id }) => id === selectedId);
    console.log({ name, baseAddress, quoteAddress })
    setVaultDetails({ 
      ...vaultDetails,  
      _vaultParams: { 
        ...vaultDetails._vaultParams, 
        asset: '0xD30a35282c2E2db07d9dAC69Bf3D45a975Bc85D1'// quoteAddress  // used qutoe address for short puts
      }, 
      _baseAsset: '0x13414675E6E4e74Ef62eAa9AC81926A3C1C7794D', //baseAddress, 
      _optionMarket: '0x4A3f1D1bdb5eD10a813f032FE906C73BAF0bc5A2', //_optionMarket,
      _tokenName: `OTUS-${name}`,
      _tokenSymbol: `OTV${name}`
    }); 
  }

  const vaultTypes = ['Short Put', 'Short Call', 'Ape Bull', 'Ape Bear', 'Iron Condor', 'Short Straddle']; 

  const onSelectVaultType = (vaultType) => {
    setVaultDetails({ ...vaultDetails, _vaultType: vaultType })
  }

  return (
    <Center>
      <Box w='474px'>
      <BaseShadowBox padding="14px">
        <Box bgImage="url('https://bit.ly/2Z4KKcF')">
          <Heading>Vault Create</Heading>
        </Box>

        <Box>

          <FormControl>
            <FormLabel htmlFor='market'>Market</FormLabel>
            <Select id='market' placeHolder="Select Market" defaultValue="" onChange={e => onSelectMarket(e.target.value)}>
              {
                markets.map(({ id, name }) => (<option value={id}>{name}</option>))
              }
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor='vault'>Vault</FormLabel>
            <Select id='vault' placeHolder="Select Vault Type" defaultValue="" onChange={e => onSelectVaultType(e.target.value)}>
              {
                vaultTypes.map((name, index) => (<option value={index}>{name}</option>))
              }
            </Select>
          </FormControl>

        </Box>

        <Box>
          <Center p="4">
            <Text as='i' p="4">
              { vaultDetails._tokenName }
            </Text>
            <Text as='i' p="4">
              { vaultDetails._tokenSymbol }
            </Text>
          </Center>
          <FormControl>
            <FormLabel htmlFor='isPublic'>Public</FormLabel>
            <Switch
                id='isPublic'
                name='isPublic'
                defaultValue={true}
              />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor='performanceFee'>Performance Fee</FormLabel>
            <Slider
              id='performanceFee'
              name='performanceFee'
              defaultValue={0}
            />
          </FormControl>
        </Box>

        <Box>
          <Button onClick={createVaultWithStrategy}>
            Create Vault
          </Button>
        </Box>
      </BaseShadowBox>
      </Box>
    </Center>
  )
}

export default VaultFlow;
