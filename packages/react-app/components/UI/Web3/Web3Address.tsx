import React from 'react'
import { useWeb3Context } from '../../../context'
import { useBalance } from '../../../hooks/Balances'
import { formatUSD, fromBigNumber } from '../../../utils/formatters/numbers'
import SUSDIcon from '../Components/Icons/Color/SUSD'

export function Web3Address() {
  const { address } = useWeb3Context()

  const { data: balance } = useBalance()
  console.log({ balance })

  if (!balance) return null;

  return (
    <div className="flex items-center justify-center">
      <div className="md: w-full rounded-md sm:max-w-xl md:max-w-2xl bg-zinc-900">
        <div className="flex flex-row justify-between py-2 px-2">
          <div className="text-left text-sm font-light">
            <SUSDIcon />
          </div>
          <div className="flex truncate text-right text-sm text-white font-normal align-middle justify-center items-center">
            {balance && formatUSD(fromBigNumber(balance))}
          </div>
        </div>
      </div>
    </div>
  )
}
