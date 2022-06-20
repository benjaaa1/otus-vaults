import { formatUnits, parseUnits } from "ethers/lib/utils";
import { getQuoteBoard, lyra } from "./lyra";
import { ONE_BN, UNIT } from "../constants/bn";
import { BigNumber } from "ethers";

export const formatBoards = async (lyraMarket) => {

  const _liveBoards = await lyraMarket.liveBoards(); 
  console.log({ _liveBoards })
  const liveBoards = _liveBoards.filter(({ timeToExpiry }) => timeToExpiry > 0)
        .map(board => {
          const boardStrikes = board.strikes()
            .filter(strike => strike.isDeltaInRange)
            .map(async (strike) => {

              // iscall isbuy
              const quote = await strike.quote(false, false, ONE_BN)

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

export const formatStrikeQuotes = async (liveStrikes, isCall, isBuy, _size) => {
  const size = BigNumber.from(_size).mul(UNIT);

  const strikesWithFees =  await Promise.all(liveStrikes.map(async (_strike) => {

    const strike = await lyra.strike('eth', _strike.id);
    console.log({ strike })

    // split these two to only query for strike once 

    const quote = await strike.quote(isCall, isBuy, size); //isCall, isBuy
    const { feeComponents: { optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee }, pricePerOption } = quote; 
    console.log({ optionPriceFee, spotPriceFee, varianceFee, vegaUtilFee, pricePerOption })

    return {
      ..._strike,
      strikePrice: parseFloat(formatUnits(strike.strikePrice)),
      id: strike.id, 
      isCall, 
      isBuy,
      optionPriceFee: parseFloat(formatUnits(optionPriceFee)), 
      spotPriceFee: parseFloat(formatUnits(spotPriceFee)), 
      varianceFee: parseFloat(formatUnits(varianceFee)),
      vegaUtilFee: parseFloat(formatUnits(vegaUtilFee)),
      pricePerOption: parseFloat(formatUnits(pricePerOption)), 
    }
  })).then(values => {
    return values; 
  });

  return strikesWithFees;
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