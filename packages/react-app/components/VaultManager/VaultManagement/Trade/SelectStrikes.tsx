import { Strike } from '@lyrafinance/lyra-js'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { ONE_BN } from '../../../../constants/bn'
import { useVaultManagerContext } from '../../../../context/VaultManagerContext'
import { LyraBoard, LyraStrike } from '../../../../queries/lyra/useLyra'
import {
  commifyAndPadDecimals,
  fromBigNumber,
  from18DecimalBN,
  formatPercentage,
  formatUSD,
} from '../../../../utils/formatters/numbers'

export default function SelectStrikes({
  selectedOptionType,
  selectedExpiry,
}: {
  selectedOptionType: number
  selectedExpiry: LyraBoard | null | undefined
}) {
  const [strikes, setStrikes] = useState([])
  console.log({ strikes })
  useEffect(() => {
    if (selectedExpiry != null && selectedExpiry.strikesByOptionTypes != null) {
      const _strikes = selectedExpiry?.strikesByOptionTypes[selectedOptionType]
      setStrikes(_strikes)
    }
  }, [selectedOptionType, selectedExpiry])

  const { toggleTrade } = useVaultManagerContext()

  return (
    <table className="min-w-full divide-y divide-zinc-800 sm:mt-10">
      <thead className="">
        <tr>
          <th
            scope="col"
            className="text-md py-3.5 pl-4 pr-3 text-left font-medium text-zinc-400 sm:pl-6"
          >
            Strike
          </th>
          <th
            scope="col"
            className="text-md hidden px-3 py-3.5 text-left font-medium text-zinc-400 sm:table-cell"
          >
            Break Event
          </th>
          <th
            scope="col"
            className="text-md hidden px-3 py-3.5 text-left font-medium text-zinc-400 lg:table-cell"
          >
            Implied Volatility
          </th>
          <th
            scope="col"
            className="text-md px-3 py-3.5 font-semibold text-zinc-400 lg:table-cell"
          >
            Price
          </th>
          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800">
        {strikes.map((strike: LyraStrike) => (
          <tr key={strike.id + selectedOptionType}>
            <td className="whitespace-nowrap py-8 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
              {formatUSD(fromBigNumber(strike.strikePrice))}
            </td>
            <td className="hidden whitespace-nowrap px-3 py-8 text-sm text-white lg:table-cell">
              {formatUSD(fromBigNumber(strike.quote.breakEven))}
            </td>
            <td className="hidden whitespace-nowrap px-3 py-8 text-sm text-white lg:table-cell">
              {formatPercentage(fromBigNumber(strike.quote.iv), true)}
            </td>
            <td className="whitespace-nowrap py-8 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <button
                onClick={
                  () => toggleTrade({ ...strike, selectedOptionType }) // change to toggle trade
                }
                className="text-indigo-600 hover:text-indigo-900"
              >
                {formatUSD(fromBigNumber(strike.quote.premium))}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
