import { Strike } from '@lyrafinance/lyra-js'
import { formatUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { LyraBoard, LyraStrike } from '../../../../queries/lyra/useLyra'
import { formatFromBigNumber } from '../../../../utils/formatters/numbers'

// const people = [
//   {
//     name: 'Lindsay Walton',
//     title: 'Front-end Developer',
//     email: 'lindsay.walton@example.com',
//     role: 'Member',
//   },
// ]
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

  return (
    <table className="min-w-full divide-y divide-gray">
      <thead className="bg-dark-gray">
        <tr>
          <th
            scope="col"
            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray sm:pl-6"
          >
            Strike
          </th>
          <th
            scope="col"
            className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray sm:table-cell"
          >
            Break Event
          </th>
          <th
            scope="col"
            className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray lg:table-cell"
          >
            Implied Volatility
          </th>
          <th
            scope="col"
            className="px-3 py-3.5 text-left text-sm font-semibold text-gray"
          >
            Price
          </th>
          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
            <span className="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray">
        {strikes.map((strike: LyraStrike) => (
          <tr key={strike.id}>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray sm:pl-6">
              {formatFromBigNumber(strike.strikePrice)}
            </td>
            <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray sm:table-cell">
              {formatFromBigNumber(strike.quote.breakEven)}
            </td>
            <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray lg:table-cell">
              {formatFromBigNumber(
                strike.quote.iv.add(strike.quote.iv.mul(strike.skew))
              )}
            </td>
            <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <a href="#" className="text-indigo-600 hover:text-indigo-900">
                Select {formatFromBigNumber(strike.quote.premium)}
                <span className="sr-only">
                  {formatFromBigNumber(strike.quote.premium)} -{' '}
                  {formatFromBigNumber(strike.quote.pricePerOption)}
                </span>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
