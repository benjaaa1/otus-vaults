import React, { useState, useEffect } from "react";
import useWeb3 from "./useWeb3";
import { useHistory } from "react-router-dom";
import { toast } from 'react-toastify';
import { ethers } from "ethers";
import { getLyraMarkets } from "../graphql";
import { MESSAGE, Notifier, TYPE } from "../notifcations";

export default function useCreateVault() {

  const history = useHistory();

  const { contracts, signer } = useWeb3({});

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  const [loading, setLoading] = useState(false); 

  const [markets, setMarkets] = useState([]); 

  const [vault, setVault] = useState();

  const [vaultDetails, setVaultDetails] = useState({
    _quoteAsset: '', 
    _baseAsset: '', 
    _vaultName: '',
    _tokenName: 'Otus', 
    _tokenSymbol: 'OTV',
    _isPublic: true, 
    _vaultType: 4, 
    _vaultParams: {
      decimals: 18,
      cap: 500000, // 500,000 usd cap
      asset: '' // susd 
    }
  });

  useEffect(async () => {
    
    try {
      const {markets} = await getLyraMarkets(); 
      console.log({ markets }); 
      setMarkets(markets);;
    } catch (e) {
      console.log(e)
    }

  }, []); 

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

  const onVaultNameChange = (name) => {
    setVaultDetails({ ...vaultDetails, _vaultName: name })
  }

  const createVaultWithStrategy = async () => {
    try {
      setLoading(true);
      const {
        _optionMarket,
        _baseAsset,
        _vaultName,
        _tokenName,
        _tokenSymbol,
        _isPublic,
        _vaultType,
        _vaultParams
      } = vaultDetails; 
      const response = await otusCloneFactory.connect(signer).cloneVaultWithStrategy(
        _optionMarket, 
        [_vaultName,
        _tokenName, 
        _tokenSymbol],
        _isPublic, 
        { ..._vaultParams, cap: ethers.utils.parseEther(_vaultParams.cap.toString()) }
      ); 
      console.log({ response }); 
      const receipt = await response.wait();
      console.log({ receipt })

      const details = await otusCloneFactory.connect(signer).getUserManagerDetails();
      Notifier(MESSAGE.VAULT_CREATE.SUCCESS, TYPE.SUCCESS)
      history.push(`/supervisors/${details['userVault']}/${details['userStrategy']}`);

      setLoading(false);
      setVault(response); 
    } catch (e) {
      console.log(e); 
      Notifier(MESSAGE.VAULT_CREATE.ERROR, TYPE.ERROR)
      setLoading(false);
    }
  }

  return { loading, vaultDetails, vaultTypes, markets, onSelectMarket, onSelectVaultType, onVaultNameChange, vaultDetails, createVaultWithStrategy }

}
