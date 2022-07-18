import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import { formatEther, formatUnits, parseUnits } from "ethers/lib/utils";

import { getLyraMarket, getLyraMarkets, getQuoteBoard } from "../helpers/lyra";
import useWeb3 from "../hooks/useWeb3";
import { BigNumber, ethers } from "ethers";
import { createVaultInitialState, createVaultReducer, HOUR_SEC, WEEK_SEC } from "../reducer/createVaultReducer";
import { MESSAGE, Notifier, TYPE } from "../notifcations";
import { useEventListener } from 'eth-hooks';
import { useHistory } from "react-router-dom";

const CreateVaultContext = createContext();

export const CreateVaultProvider = ({ children }) => {

  const history = useHistory();

  const { contracts, signer } = useWeb3({});

  const otusController = contracts ? contracts['OtusController'] : "";

  const [state, dispatch] = useReducer(createVaultReducer, createVaultInitialState);

  const [loading, setLoading] = useState(false); 

  const [step, setStep] = useState(0);

  useEffect(async () => {
    
    try { 
      const markets = await getLyraMarkets(); 
      console.log({ markets })
      dispatch({ type: 'SET_LYRA_MARKETS', payload: markets });

    } catch (e) {
      console.log(e)
    }

  }, []); 

  const onSelectMarket = (selectedId) => {
    const { name, id, baseToken, quoteToken, address} = state.markets.find(({ name }) => name === selectedId);
    console.log({ name, baseToken, quoteToken, id })
    dispatch({ type: 'SET_SELECTED_MARKET', payload: { id, name, address } });
  }

  const updateVaultInformation = (field, value) => {
    console.log({ field, value })
    if(field == 'name') {
      const tokenName = value.substring(0, 4).toUpperCase();
      const tokenSymbol = value.substring(0, 4).toUpperCase(); 
      dispatch({ type: 'UPDATE_VAULT_NAMES_INFORMATION', payload: { tokenName, tokenSymbol, name: value } });
    } else {
      dispatch({ type: 'UPDATE_VAULT_INFORMATION', payload: { field, value } });
    }
  }

  const updateVaultParams = (field, value) => {
    dispatch({ type: 'UPDATE_VAULT_PARAMS', payload: { field, value } });
  }

  const updateVaultStrategy = (field, value) => {
    dispatch({ type: 'UPDATE_VAULT_STRATEGY', payload: { field, value } });
  }

  const createVault = async () => {
    try {
      setLoading(true);

      const {
        optionMarket, 
        vaultInformation,
        vaultParams,
        vaultStrategy
      } = state;

      const { cap } = vaultParams; 
      const formattedVaultParams = { ...vaultParams, cap: ethers.utils.parseEther(cap.toString()) };
      
      const { performanceFee, managementFee } = vaultInformation; 

      const formattedVaultInformation = {
        ...vaultInformation,
        isPublic: true,
        performanceFee: parseUnits(performanceFee.toString(), 18), 
        managementFee: parseUnits(managementFee.toString(), 18),
      }

      const { collatBuffer, collatPercent, minTimeToExpiry, maxTimeToExpiry, minTradeInterval, gwavPeriod } = vaultStrategy; 
      const formattedVaultStrategy = {
        ...vaultStrategy,
        collatBuffer: parseUnits((collatBuffer / 100).toString(), 18), 
        collatPercent: parseUnits((collatPercent / 100).toString(), 18),
        minTimeToExpiry: minTimeToExpiry * HOUR_SEC, 
        maxTimeToExpiry: maxTimeToExpiry * WEEK_SEC,
        minTradeInterval: 60 * minTradeInterval,
        gwavPeriod : 60 * gwavPeriod
      }

      console.log({
        optionMarket,
        formattedVaultInformation,
        formattedVaultParams,
        formattedVaultStrategy
      })
      
      const response = await otusController.connect(signer).createOptionsVault(
        "0xdc06d81a68948544a6b453df55ccd172061c6d6e",//optionMarket,
        formattedVaultInformation,
        formattedVaultParams,
        formattedVaultStrategy
      ); 
 
      const receipt = await response.wait();
      console.log({ response, receipt })

      const { userVaults, userStrategies } = await otusController.connect(signer).getUserManagerDetails();
      Notifier(MESSAGE.VAULT_CREATE.SUCCESS, TYPE.SUCCESS);

      const userVaultInformation = userVaults.map((vault, index) => {
        const strategy = userStrategies[index];
        return { vault, strategy }
      });
      console.log({ userVaultInformation })
      const len = userVaultInformation.length; 

      history.push(`/my-vault/${userVaultInformation[len - 1].vault}/${userVaultInformation[len - 1].strategy}`);

      setLoading(false);
    } catch (e) {
      console.log(e); 
      Notifier(MESSAGE.VAULT_CREATE.ERROR, TYPE.ERROR)
      setLoading(false);
    }
  }

  const value = { 
    state, 
    dispatch, 
    onSelectMarket,
    updateVaultParams,
    updateVaultInformation,
    updateVaultStrategy,
    createVault,
    loading,
    step,
    setStep
  };

  return <CreateVaultContext.Provider value={value}>{children}</CreateVaultContext.Provider>;

};

export const useCreateVaultContext = () => {
  const context = useContext(CreateVaultContext);

  if (context === undefined) {
    throw new Error("useCreateVaultContext must be used within CreateVaultContext");
  }

  return context;
};
