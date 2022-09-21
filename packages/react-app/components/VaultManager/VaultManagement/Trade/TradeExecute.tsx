import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/20/solid'
import { useMemo } from 'react'
import { useVaultManagerContext } from '../../../../context'
import { LyraStrike } from '../../../../queries/lyra/useLyra'
import { formatFromBigNumber } from '../../../../utils/formatters/numbers'

const computeCosts = (trades: LyraStrike[] | null | undefined) => {
  return trades?.reduce(
    (accum: any, trade) => {
      const { selectedOptionType } = trade
      if (selectedOptionType == 3 || selectedOptionType == 4) {
        return {
          ...accum,
          minReceived: trade.quote.premium.add(accum.minReceived),
        }
      } else {
        return { ...accum, minCost: trade.quote.premium.add(accum.minCost) }
      }
    },
    {
      minReceived: 0,
      minCost: 0,
    }
  )
}

export default function TradeExecute() {
  const { builtTrades } = useVaultManagerContext()

  console.log({ builtTrades })

  const costs = useMemo(() => computeCosts(builtTrades), [builtTrades])
  console.log({ costs })
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-gray-200 divide-y">
        {builtTrades?.map((trade: LyraStrike) => (
          <li key={trade.id}>
            <div className="block hover:bg-green">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-indigo-600">
                    {formatFromBigNumber(trade.strikePrice)}
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="bg-green-100 text-green-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                      {trade.selectedOptionType}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="text-gray-500 flex items-center text-sm">
                      <UsersIcon
                        className="text-gray-400 mr-1.5 h-5 w-5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      {formatFromBigNumber(trade.quote.premium)}
                    </p>
                    <p className="text-gray-500 mt-2 flex items-center text-sm sm:mt-0 sm:ml-6">
                      <MapPinIcon
                        className="text-gray-400 mr-1.5 h-5 w-5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      collateral
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}

        {/** max cost & min received  */}

        <li key={'costs'}>
          <div className="block hover:bg-green">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-indigo-600">
                  Min Received
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="bg-green-100 text-green-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                    {`$${formatFromBigNumber(costs.minReceived)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-medium text-indigo-600">
                  Max Cost
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="bg-green-100 text-green-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                    {`$${formatFromBigNumber(costs.minCost)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
