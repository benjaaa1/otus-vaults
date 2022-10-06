import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { ZERO_ADDRESS, ZERO_BN } from '../constants/bn'
import { useWeb3Context } from '../context'
import { useContracts } from './Contracts'

import { useQuery } from 'react-query'
import QUERY_KEYS from '../constants/queryKeys'

export const useBalance = () => {
  const { address, network } = useWeb3Context()
  console.log({ network })
  const contracts = useContracts()
  const susdContract = contracts ? contracts['SUSD'] : null
  return useQuery<BigNumber>(
    QUERY_KEYS.Balance.Susd(address),
    async () => {
      console.log({ address, susdContract, network })
      if (address == ZERO_ADDRESS) return ZERO_BN
      if (!susdContract) return ZERO_BN
      const balance = await susdContract.balanceOf(address)
      return balance ? balance : ZERO_BN
    },
    {
      enabled: !!address && !!susdContract,
    }
  )
}
