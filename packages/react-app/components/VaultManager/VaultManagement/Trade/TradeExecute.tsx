import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/20/solid'
import { parseUnits } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { useVaultManagerContext } from '../../../../context'
import { useVaultManager } from '../../../../hooks'
import { getStrikeQuote, LyraStrike } from '../../../../queries/lyra/useLyra'
import {
  formatUSD,
  fromBigNumber,
  to18DecimalBN,
} from '../../../../utils/formatters/numbers'

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

const isLong = (optionType: number): boolean => {
  return optionType == 0 || optionType == 1
}

const isLongText = (optionType: number): string => {
  return optionType == 0 || optionType == 1 ? 'Buy' : 'Sell'
}
const isCallText = (optionType: number): string => {
  return optionType == 0 || optionType == 3 ? 'Call' : 'Put'
}

export default function TradeExecute() {
  const { builtTrades } = useVaultManagerContext()

  console.log({ builtTrades })

  const costs = useMemo(() => computeCosts(builtTrades), [builtTrades])
  console.log({ costs })
  return (
    <div className="overflow-hidden border border-zinc-700 bg-zinc-800 sm:rounded-md">
      <ul role="list" className="divide-y divide-zinc-700">
        {builtTrades?.map((trade: LyraStrike) => (
          <Trade trade={trade} />
        ))}

        {/** max cost & min received  */}

        <li key={'costs'}>
          <div className="block">
            <div className="px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between pt-2">
                <p className="truncate font-sans font-medium text-white">
                  Min Received
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="inline-flex  rounded-full bg-teal-500 px-2 text-sm font-bold leading-5 text-black">
                    {formatUSD(fromBigNumber(costs.minReceived))}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="truncate font-sans font-medium text-white">
                  Max Cost
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="inline-flex  rounded-full bg-teal-500 px-2 text-sm font-bold leading-5 text-black">
                    {formatUSD(fromBigNumber(costs.minCost))}
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

const Trade = ({ trade }: { trade: LyraStrike }) => {
  const { updateTradeSize } = useVaultManagerContext()
  const [size, setSize] = useState(fromBigNumber(trade.quote.size))
  console.log({ trade, newSize: fromBigNumber(trade.quote.size) })
  return (
    <li key={trade.id}>
      <div className="block hover:bg-zinc-700">
        <div className="px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="truncate font-mono font-bold text-white">
              {`${isLongText(trade.selectedOptionType)} ETH ${formatUSD(
                fromBigNumber(trade.strikePrice)
              )} ${isCallText(trade.selectedOptionType)}`}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="truncate font-sans font-medium text-white">
              Contracts
            </p>
            <div className="ml-2 flex flex-shrink-0">
              <label htmlFor="size" className="sr-only">
                Size
              </label>
              <div className="mt-1">
                <input
                  value={size}
                  onChange={async (e) => {
                    setSize(parseInt(e.target.value))
                    const strikeWithUpdatedQuote = await getStrikeQuote(
                      trade,
                      trade.selectedOptionType,
                      parseUnits(parseInt(e.target.value).toString(), 18)
                    )
                    console.log({
                      strikeWithUpdatedQuote,
                      price: formatUSD(
                        fromBigNumber(strikeWithUpdatedQuote.strikePrice)
                      ),
                      size: fromBigNumber(strikeWithUpdatedQuote.quote.size),
                    })
                    updateTradeSize(strikeWithUpdatedQuote)
                  }}
                  type="number"
                  name="size"
                  id="size"
                  className="block w-24 rounded-full border-zinc-900 bg-zinc-800 px-4 text-right text-zinc-200 shadow-sm focus:border-zinc-900 focus:ring-black sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="truncate font-sans font-medium text-white">
              Price per option
            </p>
            <div className="ml-2 flex flex-shrink-0">
              <p className="inline-flex  rounded-full bg-teal-500 px-2 text-sm font-bold leading-5 text-black">
                {formatUSD(fromBigNumber(trade.quote.premium))}
              </p>
            </div>
          </div>
          {!isLong(trade.selectedOptionType) ? (
            <div className="flex items-center justify-between pt-2">
              <p className="truncate font-sans font-medium text-white">
                Collateral
              </p>
              <div className="ml-2 flex flex-shrink-0">
                <p className="inline-flex  rounded-full bg-teal-500 px-2 text-sm font-bold leading-5 text-black">
                  {formatUSD(fromBigNumber(trade.strikePrice))}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}
