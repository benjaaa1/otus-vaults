import React, { useEffect } from "react";

import { useContractLoader } from "eth-hooks";
import { Button } from "../../Common/Button";
import { InputNumber } from "../../Common/Input";
import { getLyraMarkets, getLyraMarket, deployment } from "../../../helpers/lyra";
import { useState } from "react";
import { StrikesModal } from "./Strikes";
import { Flex, Box } from 'reflexbox';
import { BaseMenu } from "../../Common/Select";

import { formatUnits } from "ethers/lib/utils";
import { BaseHeaderText } from "../../../designSystem";
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
import { Slider } from "../../Common/Slider";
import { parseEther, parseUnit, parseUnits } from '@ethersproject/units';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const HOUR_SEC = 60 * 60;
const DAY_SEC = 24 * HOUR_SEC;
const WEEK_SEC = 7 * DAY_SEC;
const MONTH_SEC = 28 * DAY_SEC;
const YEAR_SEC = 365 * DAY_SEC;

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

  const onChange = () => {}

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

  const setStrategy = async () => {
    try {
      const response = await contract.connect(signer).setStrategy(
        {
          collatBuffer: toBN('1.2'), 
          collatPercent: toBN('1'),
          minTimeToExpiry: DAY_SEC,
          maxTimeToExpiry: WEEK_SEC * 2,
          targetDelta: toBN('0.2').mul(-1),
          maxDeltaGap: toBN('0.05'),
          minVol: toBN('0.8'),
          maxVol: toBN('1.3'),
          size: toBN('2'),
          minTradeInterval: 600,
          maxVolVariance: toBN('0.1'),
          gwavPeriod: 600,
        },
        {
          hedgePercentage: toBN('1.2'),
          maxHedgeAttempts: toBN('5'),
          limitStrikePricePercent: toBN('0.2'),
          leverageSize: toBN('2'),
          stopLossLimit: toBN('0.001')
        }
      ); 
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

      // const strikeId = await otusVault.strikeId();
      // console.log({ strikeId })

      // const strikeId = await otusVault.strikeId();
      // console.log({ strikeId })

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
    const board = liveBoards.find(({ id }) => id === _id); 
    console.log({ board }); 
    setBoard(board); 
  }; 

  const selctStrike = (_id) => {
    const strike = strikes.find(({ id }) => id === _id); 
    setStrikeSelected(strike); 
  }; 

  const toBN = (val) => {
    return parseUnits(val, 18);
  }

  const [{
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
  }, setStrategyDetail] = useState({
    collatBuffer: toBN('1.2'), 
    collatPercent: toBN('1'),
    minTimeToExpiry: DAY_SEC,
    maxTimeToExpiry: WEEK_SEC * 2,
    targetDelta: toBN('0.2').mul(-1),
    maxDeltaGap: toBN('0.05'),
    minVol: toBN('0.8'),
    maxVol: toBN('1.3'),
    size: toBN('2'),
    minTradeInterval: 600,
    maxVolVariance: toBN('0.1'),
    gwavPeriod: 600,
  });

  const setStrategyDetailValues = (id, value) => {
    setStrategyDetail(prevState => ({
      ...prevState,
      [id]: value
    }))
  }

  const [{
    hedgePercentage,
    maxHedgeAttempts,
    limitStrikePricePercent,
    leverageSize,
    stopLossLimit
  }, setHedgeDetail] = useState({
    hedgePercentage: toBN('1.2'),
    maxHedgeAttempts: toBN('5'),
    limitStrikePricePercent: toBN('0.2'),
    leverageSize: toBN('2'),
    stopLossLimit: toBN('0.001')
  });

  const setHedgeDetailValues = (id, value) => {
    setHedgeDetail(prevState => ({
      ...prevState,
      [id]: value
    }))
  }

  return [
      <Flex>
        
        <Box width={1/2} sx={{ borderRight: "1px solid #ccc"}}>

          <Flex>
            <Box width={1/2} sx={{ borderRight: "1px solid #ccc", padding: "20px" }}>
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
            <Box width={1/2} sx={{ padding: "20px" }}>
              <BaseMenu title={'Select Next Round Expiry'} options={boards} onClick={selectBoard} />
              <BaseMenu title={'Select Next Round Strike'} options={strikes} onClick={selctStrike} />
            </Box>
          </Flex>
          
          <Flex sx={{ borderTop: "1px solid #ccc" }}>
            <Flex>
              <Box>
               graph
              </Box>
              
            </Flex>
          </Flex>

        </Box>

        <Box width={1/2}>

          <Box sx={{ borderRight: "2px solid #9E9E9E", padding: "20px" }}>

            <BaseHeaderText>Current Strategy</BaseHeaderText>
            <Flex>
              <Box width={1/2}>
                <Slider name={"Collateral Buffer"} min={0} max={100} id={"collatBuffer"} setSliderValue={setStrategyDetailValues} sliderValue={collatBuffer} label={'%'} />
                <Slider name={"Collateral Percent"} min={0} max={100} id={"collatPercent"} setSliderValue={setStrategyDetailValues} sliderValue={collatPercent} label={'%'} />
                <Slider name={"Min. Time to Expiry"} min={0} max={100} id={"minTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={minTimeToExpiry} label={'%'} />
                <Slider name={"Max Time to Expiry"} min={0} max={100} id={"maxTimeToExpiry"} setSliderValue={setStrategyDetailValues} sliderValue={maxTimeToExpiry} label={'%'} />
                <Slider name={"Target Delta"} min={0} max={100} id={"targetDelta"} setSliderValue={setStrategyDetailValues} sliderValue={targetDelta} label={'%'} />    
              </Box>

              <Box width={1/2}>
                <Slider name={"Max Delta Gap"} min={0} max={100} id={"maxDeltaGap"} setSliderValue={setStrategyDetailValues} sliderValue={maxDeltaGap} label={'%'} />
                <Slider name={"Min Vol"} min={0} max={100} id={"minVol"} setSliderValue={setStrategyDetailValues} sliderValue={minVol} label={'%'} />
                <Slider name={"Max Vol"} min={0} max={100} id={"maxVol"} setSliderValue={setStrategyDetailValues} sliderValue={maxVol} label={'%'} />
                <Slider name={"Min Trade Interval"} min={0} max={100} id={"minTradeInterval"} setSliderValue={setStrategyDetailValues} sliderValue={minTradeInterval} label={'%'} />
                <Slider name={"Gwav Period"} min={0} max={100} id={"gwavPeriod"} setSliderValue={setStrategyDetailValues} sliderValue={gwavPeriod} label={'%'} />
              </Box>
            </Flex>

            <InputNumber min={1} max={10} defaultValue={3} onChange={onChange} />
          </Box>

          <Box sx={{ padding: "20px" }}>
            <BaseHeaderText>Hedge Strategy</BaseHeaderText>

            <Flex>
              <Box width={1/2}>
                <Slider name={"Hedge Percentage"} min={0} max={50} id={"hedgePercentage"} setSliderValue={setHedgeDetailValues} sliderValue={hedgePercentage} label={'%'} />
                <Slider name={"Max Hedge Attempts"} min={0} max={10} id={"maxHedgeAttempts"} setSliderValue={setHedgeDetailValues} sliderValue={maxHedgeAttempts} label={''} />
                <Slider name={"Limit Strike Price Percent"} min={0} max={5} id={"limitStrikePricePercent"} setSliderValue={setHedgeDetailValues} sliderValue={limitStrikePricePercent} label={'%'} />
              </Box>

              <Box width={1/2}>
                <Slider name={"Leverage Size"} min={100} max={300} id={"leverageSize"} setSliderValue={setHedgeDetailValues} sliderValue={leverageSize} label={'%'} />
                <Slider name={"Stop Loss Limit"} min={0} max={2} id={"stopLossLimit"} setSliderValue={setHedgeDetailValues} sliderValue={stopLossLimit} label={'%'} />
              </Box>
            </Flex>

          </Box>

        </Box>

      </Flex>,

      <Flex sx={{ borderTop: "2px solid #9E9E9E", padding: "20px" }}>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={getL2DepositMoverAddress}>getL2DepositMoverAddress</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={allowL1Deposits}>Accept L1 Deposits</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={setStrategyOnVault}>Set Strategy on Vault</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={setNextBoardStrikeId}>Set Strikes</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={setStrategy}>Set Strategy</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={startNextRound}>Start Next Round</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={trade}>Trade</Button>
        </Box>
        <Box width={1/8} sx={{ padding: "20px" }}>
          <Button onClick={setStrategy}>Close Round</Button>
        </Box>
      </Flex>


  ];

}
//  width={1} sx={{ padding: "20px" }}


/**
 * Strategy.sol
 */
// setStrategy 