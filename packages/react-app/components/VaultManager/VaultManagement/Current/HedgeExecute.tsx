import { parseUnits } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { useVaultManagerContext } from '../../../../context'
import { getStrikeQuote, LyraStrike } from '../../../../queries/lyra/useLyra'
import {
  formatUSD,
  fromBigNumber,
  to18DecimalBN,
} from '../../../../utils/formatters/numbers'
import { Button } from '../../../UI/Components/Button'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'
import LyraIcon from '../../../UI/Components/Icons/Color/LYRA'

const isLong = (optionType: number): boolean => {
  return optionType == 0 || optionType == 1
}

const isLongText = (optionType: number): string => {
  return optionType == 0 || optionType == 1 ? 'Buy' : 'Sell'
}
const isCallText = (optionType: number): string => {
  return optionType == 0 || optionType == 3 ? 'Call' : 'Put'
}

export default function HedgeExecute() {
  return <div className="h-10 border border-zinc-800 bg-transparent"></div>
}
