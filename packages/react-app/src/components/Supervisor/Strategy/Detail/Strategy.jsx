import React, { useEffect } from "react";

import { useContractLoader } from "eth-hooks";
import { getLyraMarkets, getLyraMarket, deployment } from "../../../../helpers/lyra";
import { useState } from "react";
import { StrikesModal } from "../Strikes";
import { Flex, Box, Center, FormControl, FormLabel } from '@chakra-ui/react';
import { BaseMenu, Select } from "../../../Common/Select";

import { formatUnits } from "ethers/lib/utils";
import { BaseHeaderText } from "../../../../designSystem";
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from '@chakra-ui/react'
import { Slider } from "../../../Common/Slider";
import { parseEther, parseUnit, parseUnits } from '@ethersproject/units';
import Action from "./Action";
import useWeb3 from "../../../../hooks/useWeb3";
import { useParams } from "react-router-dom";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;
const MONTH_SEC = 28 * DAY_SEC;
const YEAR_SEC = 365 * DAY_SEC;

export default function StrategyDetail({ strategyAddress }) {
  
  const { vault } = useParams();

  const { contracts, signer } = useWeb3({ OtusVault: vault, Strategy: strategyAddress } );

  const otusVault = contracts ? contracts['OtusVault'] : "";

  const strategy = contracts ? contracts['Strategy'] : "";

  const otusCloneFactory = contracts ? contracts['OtusCloneFactory'] : "";

  const [market,] = useState('eth'); 
  const [lyraMarket, setLyraMarket] = useState(null);
  const [liveBoards, setLiveBoards] = useState([]); 
  const [boards, setBoards] = useState([]); 
  const [board, setBoard] = useState(); 
  const [strikes, setStrikes] = useState([]); 
  const [strikeSelected, setStrikeSelected] = useState();
  const [currentStrike, setCurrentStrike] = useState({ strikePrice: '' }); 
  const [currentBoard, setCurrentBoard] = useState({ name: '' }); 

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
  
  useEffect(async () => {
    if(liveBoards.length) {
      const response = await otusVault.boardId(); 
      const currentBoardId = formatUnits(response);
      console.log({ currentBoardId })
      const response2 = await otusVault.strikeId(); 
      const currentStrikeId = formatUnits(response2); 

      const boardDetails = liveBoards.find(({ id }) => id == parseInt(currentBoardId));
      console.log({ boardDetails })
      if(boardDetails) {
        const _currentStrike = boardDetails.strikes().find(({ id }) => id == parseInt(currentStrikeId));
        setCurrentStrike(_currentStrike)
        let date = new Date(boardDetails.expiryTimestamp * 1000); 
        setCurrentBoard({ ...boardDetails, name: date.toLocaleDateString("en-US") }); 
      }

    }
  }, [liveBoards]); 
  
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
    targetDelta: .2,
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

  const setStrategy = async () => {
    try {
      console.log({ collatBuffer: collatBuffer.toString() })
      const response = await strategy.connect(signer).setStrategy(
        {
          collatBuffer: toBN(collatBuffer.toString()), 
          collatPercent: toBN(collatPercent.toString()),
          minTimeToExpiry: DAY_SEC * minTimeToExpiry,
          maxTimeToExpiry: WEEK_SEC * maxTimeToExpiry,
          targetDelta: toBN(Math.abs(targetDelta).toString()).mul(-1),
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
  
  const transformToBn = (id, v) => {
    setStrategyDetailValues(id, v);
  }

  return [
      <Flex>
        
        <Box flex="1" sx={{ borderRight: "1px solid #ccc"}}>

          <Flex>
            <Box flex="1">
              <BaseHeaderText>Strike Selection</BaseHeaderText>
              <TableContainer>
                <Table variant='simple'>
                  <Thead>
                    <Tr>
                      <Th isNumeric>Current Expiry</Th>
                      <Th isNumeric>Current Strike</Th>
                      <Th>              
                        <Select id='board' placeholder={'Select Next Round Expiry'} onChange={(e) => selectBoard(e.target.value)}>
                        {
                          boards.map(({ name, id }) => (<option value={id}>{name}</option>))
                        }
                        </Select>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>{currentBoard.name ? currentBoard.name : ''}</Td>
                      <Td>${ currentStrike.strikePrice ? formatUnits(currentStrike.strikePrice) : '' }</Td>
                      <Td>
                        <Select id='strike' placeholder={'Select Next Round Strike'} onChange={(e) => selctStrike(e.target.value)}>
                        {
                          strikes.map(({ name, id }) => (<option value={id}>{name}</option>))
                        }
                        </Select>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </Flex>
          
          <Flex>
            <Box p="4">
              graph
            </Box>
          </Flex>

        </Box>

        <Box flex='1'>

          <Box p="4">

            <BaseHeaderText>Current Strategy</BaseHeaderText>
            <Flex>
              <Box flex='1'>
                <Slider name={"Collateral Buffer"} step={.1} min={0} max={2} id={"collatBuffer"} setSliderValue={transformToBn} sliderValue={collatBuffer} label={'%'} />
                <Slider name={"Collateral Percent"} step={.05} min={0} max={1} id={"collatPercent"} setSliderValue={transformToBn} sliderValue={collatPercent} label={'%'} />
                <Slider name={"Min. Time to Expiry"} step={.5} min={0} max={7} id={"minTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={minTimeToExpiry} label={' days'} />
                <Slider name={"Max Time to Expiry"} step={1} min={0} max={100} id={"maxTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={maxTimeToExpiry} label={' days'} />
                <Slider name={"Target Delta"} step={.1} min={-1} max={1} id={"targetDelta"} setSliderValue={transformToBn} sliderValue={targetDelta} label={''} />    
                <Slider name={"Max Delta Gap"} step={.05} min={0} max={.5} id={"maxDeltaGap"} setSliderValue={transformToBn} sliderValue={maxDeltaGap} label={''} />
              </Box>

              <Box flex='1'>
                <Slider name={"Max Vol Variance"} step={.1} min={0} max={1} id={"maxVolVariance"} setSliderValue={transformToBn} sliderValue={maxVolVariance} label={''} />
                <Slider name={"Min Vol"} step={.1} min={0} max={2} id={"minVol"} setSliderValue={transformToBn} sliderValue={minVol} label={''} />
                <Slider name={"Max Vol"} step={.1} min={0} max={2} id={"maxVol"} setSliderValue={transformToBn} sliderValue={maxVol} label={''} />
                <Slider name={"Min Trade Interval"} step={5} min={0} max={60} id={"minTradeInterval"} setSliderValue={setStrategyDetailValues} sliderValue={minTradeInterval} label={' minutes'} />
                <Slider name={"Gwav Period"} step={5} min={0} max={60} id={"gwavPeriod"} setSliderValue={setStrategyDetailValues} sliderValue={gwavPeriod} label={' minutes'} />
              </Box>
            </Flex>

          </Box>

          <Box p="4">
            <BaseHeaderText>Hedge Strategy</BaseHeaderText>

            <Flex>
              <Box flex='1'>
                <Slider name={"Hedge Percentage"} step={5} min={0} max={50} id={"hedgePercentage"} setSliderValue={transformToBn} sliderValue={hedgePercentage} label={'%'} />
                <Slider name={"Max Hedge Attempts"} step={1} min={0} max={5} id={"maxHedgeAttempts"} setSliderValue={transformToBn} sliderValue={maxHedgeAttempts} label={''} />
                <Slider name={"Limit Strike Price Percent"} step={1} min={0} max={5} id={"limitStrikePricePercent"} setSliderValue={transformToBn} sliderValue={limitStrikePricePercent} label={'%'} />
              </Box>

              <Box flex='1'>
                <Slider name={"Leverage Size"} step={.5} min={1} max={3} id={"leverageSize"} setSliderValue={transformToBn} sliderValue={leverageSize} label={'x'} />
                <Slider name={"Stop Loss Limit"} step={1} min={0} max={10} id={"stopLossLimit"} setSliderValue={transformToBn} sliderValue={stopLossLimit} label={'%'} />
              </Box>
            </Flex>

          </Box>

        </Box>

      </Flex>,

      <Action 
        otusVault={otusVault} 
        strategy={strategy} 
        signer={signer} 
        board={board}
        strikeSelected={strikeSelected}
        setStrategy={setStrategy}
      /> 

  ];

}
