import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { ZERO_BN } from '../constants/bn'
import { useWeb3Context } from '../context'
import { useContracts } from './Contracts'

// import useSynthetixQueries from '@synthetixio/queries'

import { useQuery } from 'react-query'
import QUERY_KEYS from '../constants/queryKeys'

export const useBalance = () => {
  const [balance, setBalance] = useState(ZERO_BN)

  const { signer, address } = useWeb3Context()
  const contracts = useContracts()
  const susdContract = contracts ? contracts['SUSD'] : null

  // const getTokenBalance = useCallback(async () => {
  //   if (susdContract == null || signer == null || address == null) {
  //     setBalance(ZERO_BN)
  //   } else {
  //     const _balance = await susdContract.balanceOf(address)
  //     setBalance(_balance)
  //   }
  // }, [susdContract, signer, address])

  // useEffect(() => {
  //   getTokenBalance()
  // }, [susdContract, signer, address])

  return useQuery<BigNumber>(
    QUERY_KEYS.Balance.Susd(address),
    async () => {
      if (!address || !susdContract) return ZERO_BN
      const balance = await susdContract.balanceOf(address)
      return balance ? balance : ZERO_BN
    },
    {
      enabled: !!address && !!susdContract,
    }
  )
}

// export const useSnxSUSDBalance = () => {
//   const { useSynthsBalancesQuery } = useSynthetixQueries()
//   const { signer, address } = useWeb3Context()
//   const synthsBalancesQuery = useSynthsBalancesQuery(address || null)
//   const sUSDBalance =
//     synthsBalancesQuery?.data?.balancesMap?.['sUSD']?.balance ?? ZERO_BN
//   console.log({ sUSDBalance })
//   return sUSDBalance
// }
