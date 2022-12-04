import { XMarkIcon } from '@heroicons/react/20/solid'
import Lyra from '@lyrafinance/lyra-js'
import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'
import { ZERO_BN } from '../../../../constants/bn'
import { getMarketInBytes } from '../../../../constants/markets'
import { useVaultManagerContext } from '../../../../context'
import { useOtusContracts } from '../../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../../hooks/TransactionNotifier'
import { getStrikeQuote, LyraStrike, useLyra } from '../../../../queries/lyra/useLyra'
import { Vault } from '../../../../queries/myVaults/useMyVaults'
import {
  formatPercentage,
  formatUSD,
  fromBigNumber,
  toBN,
} from '../../../../utils/formatters/numbers'
import { StrikeTrade } from '../../../../utils/types'
import { Button } from '../../../UI/Components/Button'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'
import { RangeSlider } from '../../../UI/Components/RangeSlider'
import { PNLChart } from './PNLChart'

const computeCosts = (trades: LyraStrike[] | null | undefined) => {
  return trades?.reduce(
    (accum: any, trade) => {
      const { selectedOptionType, strikePrice, quote: { size } } = trade
      if (selectedOptionType == 3 || selectedOptionType == 4) {

        const collateral = toBN(String(fromBigNumber(trade.strikePrice) * fromBigNumber(size)));

        return {
          ...accum,
          minReceived: trade.quote.premium.add(accum.minReceived),
          collateral: collateral.add(accum.collateral)
        }
      } else {
        return { ...accum, minCost: trade.quote.premium.add(accum.minCost) }
      }
    },
    {
      collateral: ZERO_BN,
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

const hasSingleAssetType = (builtTrades: any[]) => {

  let ethCount = 0;
  let btcCount = 0;

  builtTrades.forEach(trade => {
    const { market } = trade;
    if (market == 'ETH') ethCount++;
    if (market == 'BTC') btcCount++;
  })

  if (ethCount > 0 && btcCount == 0) {
    return true;
  }

  if (btcCount > 0 && ethCount == 0) {
    return true;
  }

  return false;

}

export default function TradeExecute({ vault }: { vault: Vault }) {
  const lyra = useLyra();
  const { builtTrades, toggleTrade } = useVaultManagerContext()
  const otusContracts = useOtusContracts()

  const monitorTransaction = useTransactionNotifier()
  const otusVaultContract = otusContracts ? otusContracts[vault?.id] : null

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
            <Trade lyra={lyra} toggleTrade={toggleTrade} trade={trade} />
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

          {builtTrades != null && builtTrades?.length > 0 ? // check trade has collateral 
            <li key={'collateral'}>
              <div className="block">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between pt-2">
                    <p className="truncate font-sans text-xs font-semibold text-white">
                      Collateral Required: {formatPercentage(fromBigNumber(vault.strategy.vaultStrategy.collatPercent), true)}
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex font-mono  text-xs font-normal leading-5 text-white">
                        {
                          formatUSD(fromBigNumber(costs.collateral) *
                            fromBigNumber(vault.strategy.vaultStrategy.collatPercent))
                        }
                      </p>
                    </div>
                  </div>
                  {/* <div className="flex items-center justify-between pt-6">
                      <RangeSlider
                        step={5}
                        min={35}
                        max={100}
                        id={'collateral-percent'}
                        label={''}
                        value={100}
                        onChange={(e) => {
                          const minVol = toBN(e.target.value)
                          console.log({ minVol })
                        }}
                        radius={'xs'}
                        variant={'default'}
                      />
                    </div> */}
                </div>
              </div>
            </li>
            : null}

          {hasSingleAssetType(builtTrades) ? // check has single asset type
            <li key={'pnl'}>
              <div className="block">
                <div className="px-4 py-6 sm:px-6">
                  <div className="grid grid-cols-1 items-center justify-between pt-2">
                    <p className="truncate font-sans text-xs font-semibold text-white">
                      Profit and Loss
                    </p>
                    <div className='col-span-1'>
                      <PNLChart />
                    </div>
                  </div>
                </div>
              </div>
            </li> :
            null
          }
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

const Trade = ({ lyra, toggleTrade, trade }: { lyra: Lyra, toggleTrade: (trade: LyraStrike) => void, trade: LyraStrike }) => {
  const { updateTradeSize } = useVaultManagerContext()
  const [size, setSize] = useState(fromBigNumber(trade.quote.size))

  const market = trade.market

  return (
    <li key={trade.id}>
      <div className="grid grid-cols-9 gap-4 hover:bg-black">
        <div className="col-span-1">
          <div className="py-4 px-2 text-white">
            {market == 'BTC' ? <BTCIcon /> : <ETHIcon />}
          </div>
        </div>
        <div className="col-span-7 px-1 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <p className="text-md truncate font-sans font-semibold text-zinc-500">
              {`${isLongText(trade.selectedOptionType)} ${market} ${formatUSD(
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
                      lyra,
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
        <div className="col-span-1">
          <div onClick={() => toggleTrade(trade)} className="py-2 text-white cursor-pointer">
            <XMarkIcon
              className="block h-5 w-5 text-zinc-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </li>
  )
}
