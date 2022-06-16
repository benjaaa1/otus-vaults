import { formatUnits } from "ethers/lib/utils";
import { BigNumber } from '@ethersproject/bignumber'
import { getQuoteBoard } from "./lyra";

export const ZERO_BN = BigNumber.from(0)
export const UNIT = BigNumber.from(10).pow(18)
export const ONE_BN = BigNumber.from(1).mul(UNIT)
export const MAX_BN = BigNumber.from(2).pow(256).sub(1)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const formatBoards = async (lyraMarket) => {

  const _liveBoards = await lyraMarket.liveBoards(); 

  const liveBoards = _liveBoards.filter(({ timeToExpiry }) => timeToExpiry > 0)
        .map(board => {
          const boardStrikes = board.strikes()
            .filter(strike => strike.isDeltaInRange)
            .map(async (strike) => {

              // iscall isbuy
              const quote = await strike.quote(false, false, BigNumber.from(1).mul(UNIT))

              const { feeComponents } = quote; 
              const { optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee } = feeComponents; 
              
              console.log({
                quote: quote,
                size: formatUnits(quote.size),
                pricePerOption: formatUnits(quote.pricePerOption),
                premium: formatUnits(quote.premium),
                fee: formatUnits(quote.premium),
                optionPriceFee: formatUnits(optionPriceFee), 
                spotPriceFee: formatUnits(spotPriceFee), 
                varianceFee: formatUnits(varianceFee), 
                vegaUtilFee: formatUnits(vegaUtilFee)
              })
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
        }, 
      {}); 

    return liveBoards; 

}

export const formatStrikeQuotes = async (selectBoardId) => {

  const sizeSelected = 1; 
  
  const strikeQuotes = await getQuoteBoard('eth', selectBoardId, sizeSelected); 
  
  const formattedStrikeQuotes = strikeQuotes.map(({ strikeId, ask, bid }) => {
    return {
      strikeId,
      ask_premium: formatUnits(ask.premium), 
      ask_pricePerOption: formatUnits(ask.pricePerOption),
      ask_fee: formatUnits(ask.fee),
      bid_premium: formatUnits(bid.premium), 
      bid_pricePerOption: formatUnits(bid.pricePerOption),
      bid_fee: formatUnits(bid.fee),
    }
  }).reduce((acc, strike)  => {
    const { 
      strikeId, 
      ask_premium, 
      ask_pricePerOption,
      ask_fee,
      bid_premium, 
      bid_pricePerOption,
      bid_fee,
    } = strike;
    return { ...acc, [strikeId]: { 
      ask_premium, 
      ask_pricePerOption,
      ask_fee,
      bid_premium, 
      bid_pricePerOption,
      bid_fee,
      } }
  }, {});

  return formattedStrikeQuotes;

}

const isValidValidStrategy = () => {}

const loadTradeState = () => {}

const setVaultStrategy = () => {}

const setHedgeStrategy = () => {}

const reducePosition = () => {}

const startRound = () => {}

const closeRound = () => {}

const trade = () => {}

const hedge = () => {}