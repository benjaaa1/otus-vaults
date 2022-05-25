import React, { useEffect, useState } from "react";
import { useContractLoader } from "eth-hooks";
import { getLyraMarket } from "../../../../helpers/lyra";

import { formatUnits } from "ethers/lib/utils";
import { parseUnits } from '@ethersproject/units';

import { Flex, Box, FormControl, FormLabel, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from '@chakra-ui/react';
import { BaseHeaderText } from "../../../../designSystem";

import { Select, Slider } from "../../../Common/Select";

const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;

export default function StrategyDetail({ otusVault, strategyAddress, signer, contractConfig, chainId }) {
  console.log({ strategyAddress })
  const contracts = useContractLoader(signer, { ...contractConfig, customAddresses: { Strategy: strategyAddress } }, chainId);

  const contract = contracts ? contracts['Strategy'] : "";

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  console.log({ contract })

  const [market,] = useState('eth'); 
  const [lyraMarket, setLyraMarket] = useState(null);
  const [liveBoards, setLiveBoards] = useState([]); 
  const [boards, setBoards] = useState([]); 
  const [board, setBoard] = useState(); 
  const [strikes, setStrikes] = useState([]); 
  const [strikeSelected, setStrikeSelected] = useState();

  const getL2DepositMoverAddress = async () => {
    try {
      const bridge = await otusCloneFactory.connect(signer).vaultBridge(otusVault.address); 
      console.log({ bridge });
    } catch (error) {
      console.log({ error });
    }
  }

  const allowL1Deposits = async () => {
    try {
      console.log({ vaultAddress: otusVault.address, otusCloneFactory })
      const response = await otusCloneFactory.connect(signer)._cloneL2DepositMover(otusVault.address); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const setStrategyOnVault = async () => {
    try {
      const response = await otusVault.connect(signer).setStrategy(strategyAddress); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const setNextBoardStrikeId = async () => {
    console.log({ board, strikeSelected })
    try {
      const response = await otusVault.connect(signer).setNextBoardStrikeId(parseUnits(board.id.toString()), parseUnits(strikeSelected.id.toString())); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const startNextRound = async () => {
    try {
      const response = await otusVault.connect(signer).startNextRound(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  const trade = async () => {
    try {
      const optionType = await contract.vaultOptionTypes(3);
      console.log({ optionType })
      const response = await otusVault.connect(signer).trade(); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  useEffect(async () => {
    const response = await otusVault.boardId(); 
    console.log({ boardId: formatUnits(response) })
    const strikeId = await otusVault.strikeId(); 
    console.log({ strikeId: formatUnits(strikeId) })
  }, []); 

  useEffect(async () => {
    try {
      const _market = await getLyraMarket(market); 
      setLyraMarket(_market); 
    } catch (error) {
      console.log({ error })
    }
  }, []); 

  useEffect(async () => {
    if(lyraMarket) {
      try {
        const _liveBoards = await lyraMarket.liveBoards(); 
        console.log({ _liveBoards }); 
        console.log({ strikes: _liveBoards[0].strikes() })
        setLiveBoards(_liveBoards);
        setBoards(_liveBoards.filter(({ timeToExpiry }) => timeToExpiry > 0).map(board => {
          let date = new Date(board.expiryTimestamp * 1000); 
          return { ...board, name: date.toString() }
        }));
      } catch (error) {
        console.log({error})
      }
    }
  }, [lyraMarket])

  useEffect(() => {
    if(board) {
      const inDeltaRangeStrikes = board.strikes().filter(strike => strike.isDeltaInRange);
      console.log({ board, inDeltaRangeStrikes }); 
      setStrikes(
        inDeltaRangeStrikes.map(strike => ({
          name: `${formatUnits(strike.strikePrice)} - ${formatUnits(strike.iv)}`,
          id: strike.id,
          iv: formatUnits(strike.iv),
          skew: formatUnits(strike.skew),
          strikePrice: formatUnits(strike.strikePrice),
          vega: formatUnits(strike.vega)
        }))
      );
    }
  }, [board]);

  const selectBoard = (_id) => {
    console.log({ _id, liveBoards })
    const _parsedId = parseInt(_id); 
    const board = liveBoards.find(({ id }) => id === _parsedId); 
    console.log({ board }); 
    setBoard(board); 
  }; 

  const selctStrike = (_id) => {
    const _parsedId = parseInt(_id); 
    const strike = strikes.find(({ id }) => id === _parsedId); 
    setStrikeSelected(strike); 
  }; 

  const toBN = (val) => {
    return parseUnits(val, 18);
  }

  const [strategyDetail, setStrategyDetail] = useState({
    collatBuffer: 1.2, 
    collatPercent: 1,
    minTimeToExpiry: DAY_SEC,
    maxTimeToExpiry: WEEK_SEC * 2,
    targetDelta: -.2,
    maxDeltaGap: 0.05,
    minVol: .8,
    maxVol: 1.3,
    size: 2,
    minTradeInterval: 600,
    maxVolVariance: .1,
    gwavPeriod: 600,
  });

  const setStrategyDetailValues = (id, value) => {
    setStrategyDetail(prevState => ({
      ...prevState,
      [id]: value
    }))
  }

  const [hedgeDetail, setHedgeDetail] = useState({
    hedgePercentage: 1.2,
    maxHedgeAttempts: 5,
    limitStrikePricePercent: .2,
    leverageSize: 2,
    stopLossLimit: .001
  });

  const setHedgeDetailValues = (id, value) => {
    setHedgeDetail(prevState => ({
      ...prevState,
      [id]: value
    }))
  }
  
  const transformToBn = (id, v) => {
    setStrategyDetailValues(id, toBN(v));
  }

  const setStrategy = async () => {
    try {
      const {
        collatBuffer, 
        collatPercent,
        minTimeToExpiry,
        maxTimeToExpiry,
        targetDelta,
        maxDeltaGap,
        minVol,
        maxVol,
        size,
        minTradeInterval,
        maxVolVariance,
        gwavPeriod
      } = strategyDetail;
      const {
        hedgePercentage,
        maxHedgeAttempts,
        limitStrikePricePercent,
        leverageSize,
        stopLossLimit
      } = hedgeDetail;
      const response = await contract.connect(signer).setStrategy(
        {
          collatBuffer: toBN(collatBuffer.toString()), 
          collatPercent: toBN(collatPercent.toString()),
          minTimeToExpiry: DAY_SEC * minTimeToExpiry,
          maxTimeToExpiry: WEEK_SEC * maxTimeToExpiry,
          targetDelta: toBN(targetDelta.toString()).mul(-1),
          maxDeltaGap: toBN(maxDeltaGap.toString()),
          minVol: toBN(minVol.toString()),
          maxVol: toBN(maxVol.toString()),
          size: toBN(size.toString()),
          minTradeInterval: 60 * minTradeInterval,
          maxVolVariance: toBN(maxVolVariance.toString()),
          gwavPeriod: 60 * gwavPeriod,
        },
        {
          hedgePercentage: toBN(hedgePercentage.toString()),
          maxHedgeAttempts: toBN(maxHedgeAttempts.toString()),
          limitStrikePricePercent: toBN(limitStrikePricePercent.toString()),
          leverageSize: toBN(leverageSize.toString()),
          stopLossLimit: toBN(stopLossLimit.toString())
        }
      ); 
      console.log({ response })
    } catch (error) {
      console.log({ error })
    }
  }

  return (
      <Flex>
        
        <Box flex="1" sx={{ borderRight: "1px solid #ccc"}}>

          <Flex>
            <Box p="4" flex="1" sx={{ borderRight: "1px solid #ccc" }}>
              <BaseHeaderText>Strike Selection</BaseHeaderText>
              <TableContainer>
                <Table variant='simple'>
                  <Thead>
                    <Tr>
                      <Th isNumeric>Current Expiry</Th>
                      <Th isNumeric>Current Strike</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>May 22, 2022</Td>
                      <Td>$3200</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
            <Box p="4" flex="1">
              <FormLabel htmlFor={'board'}>Board Expiry</FormLabel>
              <FormControl>
                <Select id='board' placeHolder={'Select Next Round Expiry'} onChange={(e) => selectBoard(e.target.value)}>
                {
                  boards.map(({ name, id }) => (<option value={id}>{name}</option>))
                }
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor={'strike'}>Strike</FormLabel>
                <Select id='strike' placeHolder={'Select Next Round Strike'} onChange={(e) => selctStrike(e.target.value)}>
                {
                  strikes.map(({ name, id }) => (<option value={id}>{name}</option>))
                }
                </Select>
              </FormControl>
            </Box>
          </Flex>
          
          <Flex sx={{ borderTop: "1px solid #ccc" }}>
            <Box p="4">
              graph
            </Box>
          </Flex>

        </Box>

        <Box flex='1'>

          <Box p="4" sx={{ borderBottom: "2px solid #9E9E9E" }}>

            <BaseHeaderText>Current Strategy</BaseHeaderText>
            <Flex>
              <Box flex='1' p="4">
                <Slider name={"Collateral Buffer"} step={.1} min={0} max={2} id={"collatBuffer"} setSliderValue={transformToBn} sliderValue={collatBuffer} label={'%'} />
                <Slider name={"Collateral Percent"} step={.05} min={0} max={1} id={"collatPercent"} setSliderValue={transformToBn} sliderValue={collatPercent} label={'%'} />
                <Slider name={"Min. Time to Expiry"} step={1} min={0} max={7} id={"minTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={minTimeToExpiry} label={' days'} />
                <Slider name={"Max Time to Expiry"} step={1} min={0} max={8} id={"maxTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={maxTimeToExpiry} label={' weeks'} />
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} setSliderValue={transformToBn} sliderValue={targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} setSliderValue={transformToBn} sliderValue={maxDeltaGap} label={''} />
              </Box>

              <Box flex='1' p="4">
                <Slider name={"Max Vol Variance"} step={30} min={0} max={1} id={"maxVolVariance"} setSliderValue={transformToBn} sliderValue={maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} setSliderValue={transformToBn} sliderValue={minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} setSliderValue={transformToBn} sliderValue={maxVol} label={''} />
                <Slider name={"Min Trade Interval"} step={5} min={0} max={60} id={"minTradeInterval"} setSliderValue={setStrategyDetailValues} sliderValue={minTradeInterval} label={' minutes'} />
                <Slider name={"Gwav Period"} step={5} min={1} max={60} id={"gwavPeriod"} setSliderValue={setStrategyDetailValues} sliderValue={gwavPeriod} label={' minutes'} />
              </Box>
            </Flex>

          </Box>

          <Box p="4">
            <BaseHeaderText>Hedge Strategy</BaseHeaderText>

            <Flex>
              <Box flex='1' p="4">
                <Slider name={"Hedge Percentage"} step={5} min={0} max={50} id={"hedgePercentage"} setSliderValue={transformToBn} sliderValue={hedgePercentage} label={'%'} />
                <Slider name={"Max Hedge Attempts"} step={1} min={0} max={5} id={"maxHedgeAttempts"} setSliderValue={transformToBn} sliderValue={maxHedgeAttempts} label={''} />
                <Slider name={"Limit Strike Price Percent"} step={1} min={0} max={5} id={"limitStrikePricePercent"} setSliderValue={transformToBn} sliderValue={limitStrikePricePercent} label={'%'} />
              </Box>

              <Box flex='1' p="4">
                <Slider name={"Leverage Size"} step={.5} min={1} max={3} id={"leverageSize"} setSliderValue={transformToBn} sliderValue={leverageSize} label={'x'} />
                <Slider name={"Stop Loss Limit"} step={1} min={0} max={10} id={"stopLossLimit"} setSliderValue={transformToBn} sliderValue={stopLossLimit} label={'%'} />
              </Box>
            </Flex>

          </Box>

        </Box>

      </Flex>
  );

}
