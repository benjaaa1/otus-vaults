import { Contract, ethers, BigNumber } from 'ethers'
import { formatBytes32String, parseBytes32String } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { ZERO_BN } from '../../../../constants/bn'
import QUERY_KEYS from '../../../../constants/queryKeys'
import { useVaultManagerContext, useWeb3Context } from '../../../../context'
import {
  useContracts,
  useOtusVaultContracts,
} from '../../../../hooks/Contracts'
import { getStrikeQuote, LyraStrike } from '../../../../queries/lyra/useLyra'
import { VaultTrade } from '../../../../queries/myVaults/useMyVaults'
import {
  formatUSD,
  fromBigNumber,
  to18DecimalBN,
  toBN,
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

const usePositionDelta = (
  strategyId: string,
  builtStrikeToHedge: VaultTrade
) => {
  const { address, network } = useWeb3Context()
  const contracts = useContracts()
  const [positionDelta, setPositionDelta] = useState<BigNumber | null>(ZERO_BN)

  useEffect(() => {
    const loadFunc = async () => {
      if (
        strategyId != null &&
        contracts != null &&
        builtStrikeToHedge != null &&
        builtStrikeToHedge.strikeId != null
      ) {
        console.log({ strategyId })
        const contract = contracts['Strategy']
        const strategyContract = contract.attach(strategyId)

        const { strikeId } = builtStrikeToHedge
        console.log({ strikeId, strategyContract })
        const delta = await strategyContract._checkDeltaByPositionId(
          '0x7345544800000000000000000000000000000000000000000000000000000000',
          [toBN(strikeId)]
        )
        console.log({ delta })
        setPositionDelta(delta)
      }
    }

    void loadFunc()
  }, [contracts, strategyId, builtStrikeToHedge])

  return positionDelta
}

export default function HedgeExecute({ strategyId }: { strategyId: string }) {
  const { builtStrikeToHedge } = useVaultManagerContext()
  console.log({ builtStrikeToHedge })

  // get delta here
  const delta = usePositionDelta(strategyId, builtStrikeToHedge)

  console.log({ delta })
  return <div className="h-10 border border-zinc-800 bg-transparent">test</div>
}
