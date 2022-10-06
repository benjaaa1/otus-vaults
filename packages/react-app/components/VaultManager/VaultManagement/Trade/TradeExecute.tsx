import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'
import { BYTES32_MARKET, getMarketInBytes } from '../../../../constants/markets'
import { useVaultManagerContext } from '../../../../context'
import { useOtusVaultContracts } from '../../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../../hooks/TransactionNotifier'
import { getStrikeQuote, LyraStrike } from '../../../../queries/lyra/useLyra'
import { Vault } from '../../../../queries/myVaults/useMyVaults'
import {
  formatUSD,
  fromBigNumber,
  toBN,
} from '../../../../utils/formatters/numbers'
import { StrikeTrade } from '../../../../utils/types'
import { Button } from '../../../UI/Components/Button'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'

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

const formatTrades = (trades: LyraStrike[]): StrikeTrade[] => {
  return trades?.map((trade: LyraStrike) => {
    return {
      market: getMarketInBytes(trade.market),
      optionType: trade.selectedOptionType,
      strikeId: toBN(trade.id.toString()),
      size: trade.quote.size,
      positionId: toBN('0'),
      strikePrice: trade.strikePrice,
    }
  })
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

export default function TradeExecute({ vault }: { vault: Vault }) {
  const { builtTrades } = useVaultManagerContext()
  const otusContracts = useOtusVaultContracts()

  const monitorTransaction = useTransactionNotifier()
  const otusVaultContract = otusContracts ? otusContracts[vault?.id] : null
  console.log({ builtTrades })
  const [isExecutingTrade, setExecutingTrade] = useState(false)

  const costs = useMemo(() => computeCosts(builtTrades), [builtTrades])
  const formattedBuiltTrades: StrikeTrade[] = useMemo(
    () => formatTrades(builtTrades || []),
    [builtTrades]
  )

  const handleTrade = useCallback(async () => {
    if (otusVaultContract == null || vault == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    setExecutingTrade(true)

    const tx = await otusVaultContract.trade(formattedBuiltTrades)
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            setExecutingTrade(false)
            // refetch()
          }, 5 * 1000)
        },
        onTxFailed: () => {
          setTimeout(() => {
            setExecutingTrade(false)
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract, vault, monitorTransaction, formattedBuiltTrades])

  return builtTrades && builtTrades.length > 0 ? (
    <>
      <div className="overflow-hidden border border-zinc-800 bg-transparent sm:rounded-sm">
        <ul role="list" className="divide-y divide-zinc-700">
          {builtTrades?.map((trade: LyraStrike) => (
            <Trade trade={trade} />
          ))}

          {/** max cost & min received  */}
          {builtTrades != null && builtTrades?.length > 0 ? (
            <li key={'costs'}>
              <div className="block">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between pt-2">
                    <p className="truncate font-sans text-xs font-semibold text-white">
                      Min Received
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex font-mono  text-xs font-normal leading-5 text-white">
                        {formatUSD(fromBigNumber(costs.minReceived))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <p className="truncate font-sans text-xs font-medium text-white">
                      Max Cost
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                        {formatUSD(fromBigNumber(costs.minCost))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ) : null}
        </ul>
      </div>
      <div className="justify-stretch mt-6 flex flex-col">
        <Button
          label={'Execute Trade'}
          isLoading={isExecutingTrade}
          variant={'action'}
          radius={'xs'}
          size={'full'}
          onClick={handleTrade}
        />
      </div>
    </>
  ) : (
    <div className="h-10 border border-zinc-800 bg-transparent"></div>
  )
}

const Trade = ({ trade }: { trade: LyraStrike }) => {
  const { updateTradeSize } = useVaultManagerContext()
  const [size, setSize] = useState(fromBigNumber(trade.quote.size))
  console.log({ trade, newSize: fromBigNumber(trade.quote.size) })

  const market = trade.market

  return (
    <li key={trade.id}>
      <div className="flex hover:bg-black">
        <div className="flex-none-1 w-14">
          <div className="p-4 text-white sm:px-6">
            {market == 'BTC' ? <BTCIcon /> : <ETHIcon />}
          </div>
        </div>
        <div className="flex-1 px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-md truncate font-sans font-semibold text-zinc-500">
              {`${isLongText(trade.selectedOptionType)} ETH ${formatUSD(
                fromBigNumber(trade.strikePrice)
              )} ${isCallText(trade.selectedOptionType)}`}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="truncate font-sans text-xs font-normal text-white">
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
                    if (e.target.value == '') return
                    setSize(parseInt(e.target.value))
                    const strikeWithUpdatedQuote = await getStrikeQuote(
                      trade,
                      trade.selectedOptionType,
                      parseUnits(parseInt(e.target.value).toString(), 18)
                    )

                    updateTradeSize(strikeWithUpdatedQuote)
                  }}
                  type="number"
                  name="size"
                  id="size"
                  className="block w-24 rounded-full border-zinc-800 bg-transparent px-4 pr-2 text-right text-zinc-200 shadow-sm focus:border-zinc-900 focus:ring-black sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="truncate font-sans text-xs font-normal text-white">
              Price per option
            </p>
            <div className="ml-2 flex flex-shrink-0">
              <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                {formatUSD(fromBigNumber(trade.quote.pricePerOption))}
              </p>
            </div>
          </div>
          {!isLong(trade.selectedOptionType) ? (
            <div className="flex items-center justify-between pt-2">
              <p className="truncate font-sans text-xs font-normal text-white">
                Collateral
              </p>
              <div className="ml-2 flex flex-shrink-0">
                <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                  {formatUSD(fromBigNumber(trade.strikePrice) * size)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}
