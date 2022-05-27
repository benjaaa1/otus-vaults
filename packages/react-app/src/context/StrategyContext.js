import { createContext, useContext, useEffect, useReducer } from "react";
import { useParams } from "react-router-dom";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import { getLyraMarket } from "../helpers/lyra";
import useWeb3 from "../hooks/useWeb3";
import { ethers } from "ethers";
import { strategyInitialState, strategyReducer } from "../reducer/strategyReducer";
import { MESSAGE, Notifier, TYPE } from "../notifcations";

const StrategyContext = createContext();

export const StrategyProvider = ({ children }) => {

  const { vault, strategy: strategyAddress } = useParams();

  const { contracts, signer } = useWeb3({ OtusVault: vault, Strategy: strategyAddress });

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";

  const strategyContract = contracts ? contracts['Strategy'] : "";

  const [state, dispatch] = useReducer(strategyReducer, strategyInitialState);

  const {
    strategy,
    selectedBoard,
    market, 
    lyraMarket,
    currentStrikes
  } = state;

  useEffect(async () => {
    console.log({ state })
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
        const _liveBoards = await lyraMarket.liveBoards(); 
        const liveBoards = _liveBoards.filter(({ timeToExpiry }) => timeToExpiry > 0)
        .map(board => {
          const boardStrikes = board.strikes()
            .filter(strike => strike.isDeltaInRange)
            .map((strike) => {
              return {
                name: `${formatUnits(strike.strikePrice)} - ${formatUnits(strike.iv)}`,
                id: strike.id,
                iv: formatUnits(strike.iv),
                skew: formatUnits(strike.skew),
                strikePrice: formatUnits(strike.strikePrice),
                vega: formatUnits(strike.vega)
              }
            }); 
          const date = new Date(board.expiryTimestamp * 1000); 
          return { ...board, name: date.toString(), strikes: boardStrikes };
        })
        .reduce((a, v) => {
          return { ...a, [v.id]: v }
        }, {}); 
        dispatch({ type: 'SET_LIVE_BOARDS', payload: liveBoards });
      } catch (error) {
        console.log({error})
      }
    }
  }, [lyraMarket]);

  useEffect(async () => {
    if(otusVaultContract) {
      console.log({ otusVaultContract  })
      try {
        const _strategy = await otusVaultContract._strategy(); 
        console.log({ _strategy })
        const _hasStrategy = _strategy != ethers.constants.AddressZero ? true : false; 
        dispatch({ type: 'UPDATE_VALUE', id: 'hasStrategy', payload: _hasStrategy }); 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVaultContract])

  // vault strategy set once 

  const setStrategyOnVault = async () => {
    try {
      console.log({ strategyAddress })
      const response = await otusVaultContract.connect(signer).setStrategy(strategyAddress); 
      const receipt = response.wait(); 
      console.log({ receipt })
      Notifier(MESSAGE.SETVAULT.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
    }
  }

  const setVaultStrategy = async () => {
    try {

      const {
        collatBuffer, 
        collatPercent,
        minTimeToExpiry,
        maxTimeToExpiry,
        minTradeInterval,
        gwavPeriod,
      } = strategy; 

      const formattedStrategy = {
        collatBuffer: parseUnits(collatBuffer.toString(), 18), 
        collatPercent: parseUnits(collatPercent.toString(), 18),
        minTimeToExpiry: minTimeToExpiry,
        maxTimeToExpiry: maxTimeToExpiry,
        minTradeInterval: minTradeInterval,
        gwavPeriod: gwavPeriod,
      }

      const response = await strategyContract.connect(signer).setStrategy(formattedStrategy); 
      const receipt = response.wait(); 
      console.log({ receipt })
      Notifier(MESSAGE.VAULTSTRATEGY.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.VAULTSTRATEGY.ERROR, TYPE.ERROR)

    }
  }

  // weekly buttons

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

  const _trade = async () => {
    try {
      const strikeStrategies = currentStrikes.map(({ 
        targetDelta,
        maxDeltaGap,
        minVol,
        maxVol,
        maxVolVariance,
        optionType,
        size,
        id
      }) => {
        return {
          targetDelta: parseUnits(Math.abs(targetDelta).toString()).mul(optionType == 3 ? 1 : -1),
          maxDeltaGap: parseUnits(maxDeltaGap.toString(), 18),
          minVol: parseUnits(minVol.toString(), 18),
          maxVol: parseUnits(maxVol.toString(), 18),
          maxVolVariance: parseUnits(maxVolVariance.toString(), 18),
          optionType: parseInt(optionType),
          size: parseUnits(size.toString(), 18),
          strikeId: id
        }
      });
      console.log({ strikeStrategies });

      // const response = await otusVaultContract.connect(signer).trade(strikeStrategies);
      // const receipt = response.wait();  
      // console.log({ receipt })
      // Notifier(MESSAGE.TRADE.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.TRADE.ERROR, TYPE.ERROR)
    }
  }

  const trade = async () => {
    try {
      const owner = await strategyContract.owner();
      console.log({ owner })
      const owner1 = await otusVaultContract.owner();
      console.log({ owner1, signer: await signer.getAddress() })

      const strikeStrategies = currentStrikes.map(({ 
        targetDelta,
        maxDeltaGap,
        minVol,
        maxVol,
        maxVolVariance,
        optionType,
        size,
        id
      }) => {
        return {
          targetDelta: parseUnits(Math.abs(targetDelta).toString()).mul(optionType == 3 ? 1 : -1),
          maxDeltaGap: parseUnits(maxDeltaGap.toString(), 18),
          minVol: parseUnits(minVol.toString(), 18),
          maxVol: parseUnits(maxVol.toString(), 18),
          maxVolVariance: parseUnits(maxVolVariance.toString(), 18),
          optionType: parseInt(optionType),
          size: parseUnits(size.toString(), 18),
          strikeId: id
        }
      });
      console.log({ strikeStrategies });

      const response = await otusVaultContract.connect(signer).trade(strikeStrategies);
      const receipt = response.wait();  
      console.log({ receipt })
      Notifier(MESSAGE.TRADE.SUCCESS, TYPE.SUCCESS)

    } catch (error) {
      console.log({ error })
      Notifier(MESSAGE.TRADE.ERROR, TYPE.ERROR)
    }
  }

  const value = { 
    state, 
    dispatch, 
    setStrategyOnVault,
    setVaultStrategy,
    startRound,
    closeRound,
    trade
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