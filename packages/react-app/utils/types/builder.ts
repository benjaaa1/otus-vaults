export type StrategyStrikeTrade = {
  optionType: OptionType
  priceAt: PriceAt // change to enum
  order: number // closer to strike // ex. if a sell call and a buy call are both otm, and sell call has order 0 and buy call order 1, sell call gets first strike 
}

export type Strategy = {
  id: number
  name: string
  type: StrategyType[] // change to enum
  tags: StrategyTag[]
  description: string,
  trade: StrategyStrikeTrade[]
}

export enum OptionType {
  LONG_CALL,
  LONG_PUT,
  SHORT_CALL_BASE,
  SHORT_CALL_QUOTE,
  SHORT_PUT_QUOTE
}

export enum PriceAt {
  OTM = 0,
  ITM = 1,
  ATM = 2
}

export enum StrategyType {
  Bearish = 0,
  Bullish = 1,
  Volatile = 2,
  Calm = 3,
  Neutral = 4,
  NoIdea = 5
}

export enum StrategyTag {
  LimitedLoss = 'Limited Loss',
  LimitedGain = 'Limited Gain',
  UnlimitedLoss = 'Unlimited Loss',
  UnlimitedGain = 'Unlimited Gain',
}

export type StrategyDirection = {
  id: StrategyType,
  name: string
}