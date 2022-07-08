import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { ethers } from "ethers";
import { getLyraMarket, getQuoteBoard } from "../helpers/lyra";
import useWeb3 from "../hooks/useWeb3";
import { strategyInitialState, strategyReducer } from "../reducer/strategyReducer";
import { MESSAGE, Notifier, TYPE } from "../notifcations";
import { formatBoards, formatStrikeQuotes } from "../helpers/strategy";
import { ONE_BN } from "../constants/bn";

const StrategyContext = createContext();

export const StrategyProvider = ({ children }) => {

  const history = useHistory();

  const { vault, strategy: strategyAddress } = useParams();

  const { contracts, signer } = useWeb3({ OtusVault: vault, Strategy: strategyAddress });

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";

  const strategyContract = contracts ? contracts['Strategy'] : "";

  const [state, dispatch] = useReducer(strategyReducer, strategyInitialState);

  const {
    strategy,
    hedgeStrategy,
    selectedBoard,
    market, 
    lyraMarket,
    liveBoards,
    liveStrikes,
    liveBoardStrikes,
    needsQuotesUpdated,
    currentStrikes,
    activeCurrentStrikeIndex
  } = state;
  
  const [strategyValue, setStrategyValue] = useState({
    hasStrategy: false, 
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
        const formattedExpiry = parseFloat(formatUnits(activeExpiry)) * (10 ** 18) * 100; 
        console.log({ formattedExpiry, now: Date.now() })
        if(formattedExpiry < Date.now())  { // board not expired 
          const activeBoardId = await strategyContract.activeBoardId();
          console.log({ activeBoardId })
          const formattedActiveBoardId = Math.round(parseFloat(formatUnits(activeBoardId)) * (10 ** 18)); 
          console.log({ formattedActiveBoardId })
        }

      } catch (error) {
        console.log({ error })
      }
    }
  }, [strategyContract]);


  // this should only be run if 
  // has active expiery and actibe board id 
  useEffect(async () => {
    if(strategyValue.hasStrategy && Object.values(liveBoards).length) {

      try {
        const vaultState = await otusVaultContract.vaultState(); 
        const vaultParams = await otusVaultContract.vaultParams(); 
        // const activeStrikeIds = await strategyContract.getActiveStrikeIds();
        const currentBasePrice = await strategyContract.getSpotPriceForMarket(); 
        const [strikes, optionTypes, positionIds] = await strategyContract.getStrikeOptionTypes();
        console.log({ strikes, optionTypes, positionIds })

        const strikesInfo = await Promise.all(strikes.map(async (strikeId, index) => {
          console.log({ strikeId, strikeIdFormat: Math.round(parseFloat(formatUnits(strikeId) * (10**18))) })
          // const strike = await getStrike(Math.round(parseFloat(formatUnits(strikeId) * (10**18))));
          return {
            strikeId: strikeId, 
            positionId: Math.round(parseFloat(formatUnits(positionIds[index]) * (10 ** 18))),
            // strikePrice: formatUnits(strike.strikePrice),
            optionType: Math.round(parseFloat(formatUnits(optionTypes[index]) * (10 ** 18)))
          }; 
        }))

        // const strikeToPositionIds = await Promise.all(activeStrikeIds.map(async (strikeId) => {
        //   const formattedStrikeId = Math.round(parseFloat(formatUnits(strikeId)) * (10 ** 18));
        //   const positionId = await strategyContract.strikeToPositionId(strikeId)
        //   const formattedPositionId = Math.round(parseFloat(formatUnits(positionId)) * (10 ** 18))
        //   const strategyIndex = await strategyContract.strategyToStrikeId(strikeId)
        //   return { formattedStrikeId, formattedPositionId, strategyIndex: formatUnits(strategyIndex) }
        // }));

        console.log({ strikesInfo })

        updateValue('currentPrice', Math.round(parseFloat(formatUnits(currentBasePrice)))); 
        updateValue('vaultState', {
          round: Math.round(parseFloat(formatUnits(vaultState.round) * (10**18))),
          lockedAmount: formatUnits(vaultState.lockedAmount),
          totalPending: formatUnits(vaultState.totalPending),
          lastLockedAmount: formatUnits(vaultState.lastLockedAmount),
          lockedAmountLeft: formatUnits(vaultState.lockedAmountLeft),
          roundInProgress: vaultState.roundInProgress
        }); 
        updateValue('vaultParams', vaultParams);

        const currentStrikeStrategies = await Promise.all(strikesInfo.map(async (strikeInfo, index) => {
          // const formattedStrikeId = Math.round(parseFloat(formatUnits(strikeId)) * (10 ** 18));
          console.log({ strikeInfo })
          const currentStrikeStrategy = await strategyContract.currentStrikeStrategies(index)
          return currentStrikeStrategy
        }));

        console.log({ currentStrikeStrategies })

        // need to load combo of current strike strategies with _strike and type of option

        // dispatch({ type: 'LOAD_CURRENT_STRIKES_POSITIONS', payload: strikePositions });

        // console.log({ strikeToPositionIds })

      } catch (error) {
        console.log({ error })
      }
    }
  }, [liveBoards]);

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

      const strikeStrategies = currentStrikes.map((currentActiveStrike, index) => {
        const {
          targetDelta,
          optionType,
          _strike,
          maxDeltaGap,
          minVol,
          maxVol,
          maxVolVariance
        } = currentActiveStrike; 

        return {
          targetDelta: parseUnits(Math.abs(targetDelta).toString()).mul(parseInt(optionType) == 3 ? 1 : -1),
          maxDeltaGap: parseUnits(maxDeltaGap.toString(), 18),
          minVol: parseUnits(minVol.toString(), 18),
          maxVol: parseUnits(maxVol.toString(), 18),
          maxVolVariance: parseUnits(maxVolVariance.toString(), 18),
          optionType: parseInt(optionType),
          size: parseUnits(size.toString()),
          strikeId: _strike.id,
        }
      })

      console.log({ strikeStrategies })
      const response = await otusVaultContract.connect(signer).trade(strikeStrategies);

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
    strategyValue,
    setVaultStrategy,
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


// const setHedgeStrategy = async () => {
//   try {

//     const {
//       hedgePercentage,
//       maxHedgeAttempts,
//       leverageSize,
//       stopLossLimit
//     } = hedgeStrategy; 

//     const formattedStrategy = {
//       hedgePercentage: parseUnits(hedgePercentage.toString(), 18), 
//       maxHedgeAttempts: parseUnits(maxHedgeAttempts.toString(), 18),
//       leverageSize: parseUnits(leverageSize.toString(), 18),
//       stopLossLimit: parseUnits(stopLossLimit.toString(), 18)
//     }

//     const response = await strategyContract.connect(signer).setHedgeStrategy(formattedStrategy); 
//     const receipt = response.wait(); 
//     console.log({ receipt })
//     Notifier(MESSAGE.VAULTSTRATEGY.SUCCESS, TYPE.SUCCESS)

//   } catch (error) {
//     console.log({ error })
//     Notifier(MESSAGE.VAULTSTRATEGY.ERROR, TYPE.ERROR)

//   }
// }


// const _hedge = async () => {
//   try {
//     const response = await otusVaultContract.connect(signer)._hedge();
//     const receipt = response.wait();  
//     console.log({ receipt })
//     Notifier(MESSAGE.TRADE.SUCCESS, TYPE.SUCCESS)
//   } catch (error) {
//     console.log({ error })
//     const { data } = error; 
//     Notifier(data.message, TYPE.ERROR)

//   }
// }

  // // weekly buttons
  // const reducePosition = async () => {
  //   try {
  //     const positionId = 264;
  //     const size = parseUnits('2'); 
  //     const response = await otusVaultContract.connect(signer).reducePosition(positionId, size); 
  //     const receipt = response.wait(); 
  //     console.log({ receipt })

  //   } catch (error) {
  //     Notifier(MESSAGE.STARTROUND.ERROR, TYPE.ERROR)

  //     console.log({ error })
  //   }
  // }