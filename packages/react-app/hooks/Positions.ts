import { BigNumber } from 'ethers'
import { useEffect, useState } from 'react'
import { VaultTrade } from '../queries/myVaults/useMyVaults'
import { ZERO_BN } from '../constants/bn'
import { useWeb3Context } from '../context'
import { useContracts } from './Contracts'

export const usePositionDelta = (
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
        contracts['Strategy'] != null &&
        builtStrikeToHedge != null &&
        builtStrikeToHedge.positionId != null
      ) {
        console.log({ strategyId })
        const contract = contracts['Strategy']
        const strategyContract = contract.attach(strategyId)

        const { positionId } = builtStrikeToHedge
        console.log({ positionId, strategyContract })
        const delta = await strategyContract._checkDeltaByPositionId(
          '0x7345544800000000000000000000000000000000000000000000000000000000',
          positionId
        )
        console.log({ delta })
        setPositionDelta(delta)
      }
    }

    void loadFunc()
  }, [contracts, strategyId, builtStrikeToHedge])

  return positionDelta
}
