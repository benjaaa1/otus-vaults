import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { ethers } from "ethers";
import { getLyraMarket, getStrike } from "../helpers/lyra";
import useWeb3 from "../hooks/useWeb3";
import { strategyInitialState, strategyReducer } from "../reducer/strategyReducer";
import { MESSAGE, Notifier, TYPE } from "../notifcations";
import { formatBoards, formatStrikeQuotes } from "../helpers/strategy";
import { ONE_BN } from "../constants/bn";


const StrategyContext = createContext();

export const StrategyProvider = ({ children }) => {

  const history = useHistory();

  const { vault, strategy: strategyAddress } = useParams();
  console.log({ strategyAddress })
  const { contracts, signer } = useWeb3({ OtusVault: vault, Strategy: strategyAddress });

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";

  const strategyContract = contracts ? contracts['Strategy'] : "";

  const [state, dispatch] = useReducer(strategyReducer, strategyInitialState);

  const {
    selectedBoard,
    market, 
    lyraMarket,
    liveStrikes,
    currentStrikes
  } = state;
  
  const [strategyValue, setStrategyValue] = useState({
    hasStrategy: false, 
    activeExpiry: null,
    vaultState: { 
      round: 0,
      totalPending: 0,
      lastLockedAmount: 0,
      lockedAmountLeft: 0,
      lockedAmount: 0,
      roundInProgress: false
    },
    vaultParams: {
      cap: 0,
      asset: ''
    },
    activeBoardId: null,
    currentPrice: 0,
  })

  const { activeBoardId } = strategyValue; 

  useEffect(async () => {
    if(market) {
      try {
        const _lyraMarket = await getLyraMarket(market); 
        dispatch({ type: 'UPDATE_LYRA_MARKET', payload: _lyraMarket }); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [market]); 

  useEffect(async () => {
    if(lyraMarket) {
      try {
        const liveBoards = await formatBoards(lyraMarket); 
        console.log({ liveBoards })
        dispatch({ type: 'SET_LIVE_BOARDS', payload: liveBoards });
      } catch (error) {
        console.log({error})
      }
    }
  }, [lyraMarket]);

  const updateValue = (id, value) => {
    setStrategyValue(prevState => ({ ...prevState, [id]: value }))
  }

  useEffect(async () => {
    if(strategyContract) {

      try {

        const activeExpiry = await strategyContract.activeExpiry();
        const formattedExpiry = parseFloat(formatUnits(activeExpiry)) * (10 ** 18) * 1000; 

        if(formattedExpiry > Date.now())  { // board not expired 
          const activeBoardId = await strategyContract.activeBoardId();
          const formattedActiveBoardId = Math.round(parseFloat(formatUnits(activeBoardId)) * (10 ** 18)); 
          updateValue('activeBoardId', formattedActiveBoardId); 
          const _date = new Date(formattedExpiry); 
          const _dateS = _date.toDateString(); 
          updateValue('activeExpiry', _dateS); 
        }

      } catch (error) {
        console.log({ error })
      }
    }
  }, [strategyContract]);

  useEffect(async () => {
    if(activeBoardId && activeBoardId > 0) {

      const [strikes, optionTypes, positionIds] = await strategyContract.getStrikeOptionTypes();
      console.log({ strikes, optionTypes, positionIds })

      const strikesInfo = await Promise.all(strikes.map(async (strikeId, index) => {
        const strike = await getStrike(Math.round(parseFloat(formatUnits(strikeId) * (10**18))));
        const optionType = Math.round(parseFloat(formatUnits(optionTypes[index]) * (10 ** 18))); 
      
        return {
          strikeId: strike.id, 
          positionId: Math.round(parseFloat(formatUnits(positionIds[index]) * (10 ** 18))),
          strikePrice: formatUnits(strike.strikePrice),
          optionType: optionType == 3 || optionType == 4 || optionType == 5 ? optionType - 1 : optionType
        }; 
      }))

      dispatch({ type: 'SET_CURRENT_ROUND_STRIKES', payload: strikesInfo });

    }
  }, [activeBoardId])

  useEffect(async () => {
    if(otusVaultContract) {
      try {

        const vaultState = await otusVaultContract.vaultState(); 
        updateValue('vaultState', {
          round: Math.round(parseFloat(formatUnits(vaultState.round) * (10**18))),
          lockedAmount: formatUnits(vaultState.lockedAmount),
          totalPending: formatUnits(vaultState.totalPending),
          lastLockedAmount: formatUnits(vaultState.lastLockedAmount),
          lockedAmountLeft: formatUnits(vaultState.lockedAmountLeft),
          roundInProgress: vaultState.roundInProgress
        }); 

      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVaultContract])

  const setVaultStrategy = async () => {

    const { vaultStrategy } = state; 

    try {

      const {
        collatBuffer, 
        collatPercent,
        minTimeToExpiry,
        maxTimeToExpiry,
        minTradeInterval,
        gwavPeriod,
      } = vaultStrategy; 

      const formattedStrategy = {
        collatBuffer: parseUnits((collatBuffer / 100).toString(), 18), 
        collatPercent: parseUnits((collatPercent / 100).toString(), 18),
        minTimeToExpiry: minTimeToExpiry,
        maxTimeToExpiry: maxTimeToExpiry,
        minTradeInterval: minTradeInterval,
        gwavPeriod: gwavPeriod,
      }

      const response = await strategyContract.connect(signer).setStrategy(formattedStrategy); 
      const receipt = response.wait(); 
      Notifier(MESSAGE.VAULTSTRATEGY.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.VAULTSTRATEGY.ERROR, TYPE.ERROR)

    }
  }

  const setStrikeStrategyDetail = async () => {
    try {
      const { strikeStrategy } = state; 

      const strikeStrategies = Object.values(strikeStrategy).map(strategy => {
        const {
          targetDelta,
          optionType,
          maxDeltaGap,
          minVol,
          maxVol,
          maxVolVariance
        } = strategy; 

        return {
          targetDelta: parseUnits(Math.abs(targetDelta).toString()).mul(parseInt(optionType) == 3 ? 1 : -1),
          maxDeltaGap: parseUnits(maxDeltaGap.toString(), 18),
          minVol: parseUnits(minVol.toString(), 18),
          maxVol: parseUnits(maxVol.toString(), 18),
          maxVolVariance: parseUnits(maxVolVariance.toString(), 18),
          optionType: parseInt(optionType),
        }
      })

      console.log({ strikeStrategies })

      const response = await strategyContract.connect(signer).setStrikeStrategyDetail(strikeStrategies); 
      const receipt = response.wait(); 

      Notifier(MESSAGE.VAULTSTRATEGY.SUCCESS, TYPE.SUCCESS)
    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.VAULTSTRATEGY.ERROR, TYPE.ERROR)
    }
  }

  const setHedgeStrategy = async () => {
    try {
  
      const { hedgeStrategy } = state; 

      const {
        hedgePercentage,
        maxHedgeAttempts,
        leverageSize,
        stopLossLimit
      } = hedgeStrategy; 
      
      const formattedStrategy = {
        hedgePercentage: parseUnits(hedgePercentage.toString(), 18), 
        maxHedgeAttempts: parseUnits(maxHedgeAttempts.toString(), 18),
        leverageSize: parseUnits(leverageSize.toString(), 18),
        stopLossLimit: parseUnits(stopLossLimit.toString(), 18),
        optionType: 5 // for now only short put will be supported
      }
  
      const response = await strategyContract.connect(signer).setHedgeStrategy([formattedStrategy]); 
      const receipt = response.wait(); 
      console.log({ receipt })
      Notifier(MESSAGE.VAULTSTRATEGY.SUCCESS, TYPE.SUCCESS)
  
    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.VAULTSTRATEGY.ERROR, TYPE.ERROR)
  
    }
  }

  const startRound = async () => {
    try {
      if(selectedBoard.id) {
        console.log({ selectedBoard })
        const response = await otusVaultContract.connect(signer).startNextRound(selectedBoard.id); 
        const receipt = response.wait(); 
        console.log({ receipt })
        Notifier(MESSAGE.STARTROUND.SUCCESS, TYPE.SUCCESS)
      }
    } catch (error) {
      Notifier(MESSAGE.STARTROUND.ERROR, TYPE.ERROR)

      console.log({ error })
    }
  }

  const closeRound = async () => {
    try {
      const response = await otusVaultContract.connect(signer).closeRound();
      const receipt = response.wait();  
      console.log({ receipt })
      Notifier(MESSAGE.CLOSEROUND.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.CLOSEROUND.ERROR, TYPE.ERROR)
    }
  }

  const trade = async () => {
    try {

      const { size } = state; 

      const strikeTrades = currentStrikes.map(strike => {

        console.log({ strike })
        const {
          optionType,
          futuresHedge, 
          _strike
        } = strike; 

        return {
          optionType, 
          strikeId: _strike.id, 
          size: parseUnits(size.toString()),
          futuresHedge
        }
      });

      console.log({ strikeTrades })
      const response = await otusVaultContract.connect(signer).trade(strikeTrades);

      const receipt = response.wait();  
      console.log({ receipt })
      Notifier(MESSAGE.TRADE.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      const { data } = error; 
      Notifier(data.message, TYPE.ERROR)
    }
  }

  const viewVault = () => history.push(`/vault/${vault}`);

  const setSelectedBoard = async (id) => {
    const { liveBoards } = state; 
    const selectedBoard = liveBoards[id];

    // set buy call first 
    const liveBoardStrikes = await Promise.all(selectedBoard.strikes).then((values) => {
      return values; 
    });
    console.log({ liveStrikes })
    dispatch({ type: 'SET_SELECTED_BOARD', payload: { selectedBoard, liveBoardStrikes }})
  }

  const value = { 
    state, 
    dispatch, 
    strategyAddress,
    strategyValue,
    setVaultStrategy,
    setStrikeStrategyDetail,
    setHedgeStrategy,
    startRound,
    closeRound,
    trade,
    viewVault,
    setSelectedBoard
  };

  return <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>;

};

export const useStrategyContext = () => {
  const context = useContext(StrategyContext);

  if (context === undefined) {
    throw new Error("useStrategyContext must be used within StrategyContext");
  }

  return context;
};
