import React, { useState, useEffect } from "react";
import { Label, Slider, Switch } from '@rebass/forms'
import { Button } from "../../Common/Button"; 
import { Select } from "../../Common/Select"; 
import { Flex, Box } from 'reflexbox';

import { ethers } from "ethers";
import { getLyraMarkets } from "../../../graphql";
import { useHistory, useRouteMatch } from "react-router-dom";
import colors from "../../../designSystem/colors";
import { BaseShadowBox } from "../../Common/Container";

const VaultFlow = ({ contract, signer }) => {

  const history = useHistory();

  const [vault, setVault] = useState(); 
  const [markets, setMarkets] = useState([]); 

  const [vaultDetails, setVaultDetails] = useState({
    _quoteAsset: '', 
    _baseAsset: '', 
    _tokenName: 'Otus', 
    _tokenSymbol: 'OTV',
    _isPublic: true, 
    _vaultType: 0, 
    _vaultParams: {
      decimals: 18,
      cap: ethers.utils.parseEther('500000'), // 500,000 usd cap
      asset: '' // susd 
    }
  });

  useEffect(async () => {
    
    if(contract) {
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
    console.log(vaultDetails); 
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
      const response = await contract.connect(signer).cloneVaultWithStrategy(
        _optionMarket, 
        _baseAsset.toLowerCase(), 
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
    <BaseShadowBox padding={0}>

    <Box
      bg={colors.background.one}
      as='form'
      onSubmit={e => e.preventDefault()}
      py={3}>
      <Flex mx={-2} mb={3}>
        <Box width={1} px={2}>
          <Label htmlFor='market'>Market</Label>
          <Select id='market' defaultValue="" onChange={e => onSelectMarket(e.target.value)}>
            <option value="">Select Market</option>
            {
              markets.map(({ id, name }) => (<option value={id}>{name}</option>))
            }
          </Select>
        </Box>
        <Box width={1} px={2}>
          <Label htmlFor='vault'>Vault</Label>
          <Select id='vault' defaultValue="" onChange={e => onSelectVaultType(e.target.value)}>
            <option value="">Select Vault Type</option>
            {
              vaultTypes.map((name, index) => (<option value={index}>{name}</option>))
            }
          </Select>
        </Box>
      </Flex>
      <Flex mx={-2} mb={3}>
        <Box width={1/2} px={2}>
          <Label width={[ 1/2, 1/4 ]} p={2}>
            { vaultDetails._tokenName }
          </Label>
          <Label width={[ 1/2, 1/4 ]} p={2}>
            { vaultDetails._tokenSymbol }
          </Label>
        </Box>

        <Box width={1/2} px={2}>
          <Label htmlFor='isPublic'>Public</Label>
          <Switch
              id='isPublic'
              name='isPublic'
              defaultValue={true}
            />
        </Box>

        <Box width={1} px={2}>
          <Label htmlFor='performanceFee'>Performance Fee</Label>
          <Slider
            id='performanceFee'
            name='performanceFee'
            defaultValue={0}
          />
        </Box>
      </Flex>
      <Flex mx={-2} mb={3}>
        <Box px={2} ml='auto'>
          <Button onClick={createVaultWithStrategy}>
            Create Vault
          </Button>
        </Box>
      </Flex>
    </Box>
    </BaseShadowBox>
  )
}

export default VaultFlow;
