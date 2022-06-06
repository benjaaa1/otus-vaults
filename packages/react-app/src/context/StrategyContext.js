import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { useParams } from "react-router-dom";
import { formatEther, formatUnits, parseUnits } from "ethers/lib/utils";

import { getLyraMarket, getQuoteBoard, getStrikeQuotes } from "../helpers/lyra";
import useWeb3 from "../hooks/useWeb3";
import { BigNumber, ethers } from "ethers";
import { strategyInitialState, strategyReducer } from "../reducer/strategyReducer";
import { MESSAGE, Notifier, TYPE } from "../notifcations";
import { useEventListener } from 'eth-hooks';

const StrategyContext = createContext();

export const StrategyProvider = ({ children }) => {

  const { vault, strategy: strategyAddress } = useParams();

  const { contracts, signer } = useWeb3({ OtusVault: vault, Strategy: strategyAddress });

  const otusVaultContract = contracts ? contracts['OtusVault'] : "";

  const strategyContract = contracts ? contracts['Strategy'] : "";

  // const events = useEventListener(strategyContract, eventFilter, startBlock, toBlock?, options?): THookResult<GTypedEvent[]>

  const [state, dispatch] = useReducer(strategyReducer, strategyInitialState);

  const {
    strategy,
    selectedBoard,
    market, 
    lyraMarket,
    needsQuotesUpdated,
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
                name: `${formatUnits(strike.strikePrice)}`,
                id: strike.id,
                iv: formatUnits(strike.iv),
                iv_formatted: `${formatUnits(strike.iv)}`,
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
    if(selectedBoard && needsQuotesUpdated) {
      const strikeQuotes = await getQuoteBoard('eth', selectedBoard.id); 
      const formattedStrikeQuotes = strikeQuotes.map(({ strikeId, premium, pricePerOption }) => {
        return {
          strikeId,
          premium: formatUnits(premium), 
          pricePerOption: formatUnits(pricePerOption)
        }
      }).reduce((acc, strike)  => {
        const { strikeId, premium, pricePerOption } = strike;
        return { ...acc, [strikeId]: { premium, pricePerOption } }
      }, {});

      console.log({ formattedStrikeQuotes})
      
      dispatch({ type: 'UPDATE_STRIKES_WITH_PREMIUMS', payload: formattedStrikeQuotes })
    }
  }, [selectedBoard, needsQuotesUpdated])

  const [strategyValue, setStrategyValue] = useState({
    hasStrategy: false, 
    vaultState: { 
      round: 0,
      lockedAmount: 0,
      roundInProgress: false
    },
    vaultParams: {
      cap: 0,
      asset: ''
    },
    activeBoardId: 0,
  })

  const updateValue = (id, value) => {
    setStrategyValue(prevState => ({ ...prevState, [id]: value }))
  }

  const isValidStrategyAddress = async () => {
    const _strategy = await otusVaultContract._strategy(); 
    console.log({ _strategy })
    console.log(ethers.constants.AddressZero)
    const isValid = _strategy != ethers.constants.AddressZero ? true : false; 
    console.log({ isValid })
    return isValid; 
  }

  useEffect(async () => {
    if(otusVaultContract) {
      console.log({ otusVaultContract  })
      try {

        const _hasStrategy = await isValidStrategyAddress(); 
        updateValue('hasStrategy', _hasStrategy); 

      } catch (error) {
        console.log({ error })
      }
    }
  }, [otusVaultContract]);

  useEffect(async () => {
    if(strategyValue.hasStrategy) {
      console.log({ otusVaultContract  })
      try {
        const vaultState = await otusVaultContract.vaultState(); 
        const vaultParams = await otusVaultContract.vaultParams(); 
        const activeBoardId = await strategyContract.activeBoardId();
        const activeStrikeIds = await strategyContract.getActiveStrikeIds();

        console.log({ activeStrikeIds, vaultState, vaultParams, activeBoardId })


        const strikeToPositionIds = await Promise.all(activeStrikeIds.map(async (strikeId) => {
          const formattedStrikeId = Math.round(parseFloat(formatUnits(strikeId)) * (10 ** 18));
          const positionId = await strategyContract.strikeToPositionId(strikeId)
          const formattedPositionId = Math.round(parseFloat(formatUnits(positionId)) * (10 ** 18))
          const strategyIndex = await strategyContract.strategyToStrikeId(strikeId)
          return { formattedStrikeId, formattedPositionId, strategyIndex: formatUnits(strategyIndex) }
        }));

        console.log({ strikeToPositionIds })

        updateValue('vaultState', vaultState); 
        updateValue('vaultParams', vaultParams);
        updateValue('activeBoardId', activeBoardId); 

        const currentStrikeStrategies = await strategyContract.currentStrikeStrategies(0); 
        console.log({ currentStrikeStrategies }); 
 
      } catch (error) {
        console.log({ error })
      }
    }
  }, [strategyValue.hasStrategy]);

  const setStrategyOnVault = async () => {
    try {
      console.log({ strategyAddress })
      const response = await otusVaultContract.connect(signer).setStrategy(strategyAddress); 
      const receipt = response.wait(); 
      console.log({ receipt })
      const _hasStrategy = isValidStrategyAddress(); 
      updateValue('hasStrategy', _hasStrategy); 
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

      const optionMarket = await strategyContract.optionMarket(); 

      console.log({ optionMarket })

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

  const trade = async (index) => {
    try {

      const currentActiveStrike = currentStrikes.filter((strike, _index) => index == _index); 

      const strikes = await strategyContract.getStrikes(currentActiveStrike.map(strike => strike.id)); 

      console.log({ currentActiveStrike, strikes }); 

      // const collaterals = await Promise.all(strikes.map(async (strike, index) => {
      //   const currentStrike = currentActiveStrike[index]; 
      //   console.log({ 
      //     strikePrice: formatUnits(strike.strikePrice), 
      //     id: formatUnits(strike.id), 
      //     strikeId: currentStrike.id, 
      //     optionType: currentStrike.optionType  
      //   })
      //   return await strategyContract.getRequiredCollateral(strike, parseUnits(currentStrike.size.toString()), currentStrike.optionType)
      // }));

      // collaterals.map(collateral => {
      //   console.log({ collateralToAdd: formatEther(collateral.collateralToAdd), setCollateralTo: formatEther(collateral.setCollateralTo) })
      // })

      const strikeStrategies = currentActiveStrike.map(({ 
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
          targetDelta: parseUnits(Math.abs(targetDelta).toString()).mul(parseInt(optionType) == 3 ? 1 : -1),
          maxDeltaGap: parseUnits(maxDeltaGap.toString(), 18),
          minVol: parseUnits(minVol.toString(), 18),
          maxVol: parseUnits(maxVol.toString(), 18),
          maxVolVariance: parseUnits(maxVolVariance.toString(), 18),
          optionType: parseInt(optionType),
          size: parseUnits(size.toString()),
          strikeId: id,
          // collateralToAdd: collaterals[0].collateralToAdd, 
          // setCollateralTo: collaterals[0].setCollateralTo
        }
      });

      console.log({ st12:strikes[0], strikeStrategies })

      // const col = await strategyContract.getCollateral(
      //   strikeStrategies[0].strikeId,
      //   strikeStrategies[0].size, 
      //   strikeStrategies[0].optionType);
      // console.log({ collateralToAdd: formatUnits(col[0]), setCollateralTo: formatUnits(col[1]), asset: formatUnits(col[2]) })

      // const _getPremiumLimit = await strategyContract._getPremiumLimit2(
      //   strikes[0],
      //   true, 
      //   strikeStrategies[0]);
      // console.log({ limitPremium: formatUnits(_getPremiumLimit[0]), spotPrice: formatUnits(_getPremiumLimit[1])  })

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
    strategyValue,
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
