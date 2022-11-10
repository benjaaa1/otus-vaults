import {
  formatNumber,
  formatUSD,
  fromBigNumber,
} from './numbers';

const isLongText = (optionType: number): string => {
  return optionType == 0 || optionType == 1 ? 'Buy' : 'Sell'
}
const isCallText = (optionType: number): string => {
  return optionType == 0 || optionType == 3 ? 'Call' : 'Put'
}

export const buildTradeTitle = (optionType, market, strikePrice) => `${isLongText(optionType)} ${market} ${formatUSD(fromBigNumber(strikePrice))} ${isCallText(optionType)}`


