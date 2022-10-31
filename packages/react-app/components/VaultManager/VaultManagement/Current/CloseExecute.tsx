import { useVaultManagerContext, useWeb3Context } from '../../../../context'
import { useLatestRates } from '../../../../queries/synth/useLatestRates'
import {
  formatNumber,
  formatUSD,
  fromBigNumber,
} from '../../../../utils/formatters/numbers'
import { Button } from '../../../UI/Components/Button'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'

const isLong = (optionType: number): boolean => {
  return optionType == 0 || optionType == 1
}

const isLongText = (optionType: number): string => {
  return optionType == 0 || optionType == 1 ? 'Buy' : 'Sell'
}
const isCallText = (optionType: number): string => {
  return optionType == 0 || optionType == 3 ? 'Call' : 'Put'
}

export default function CloseExecute() {
  const { builtStrikeToClose } = useVaultManagerContext()
  console.log({ builtStrikeToClose })

  const { data, isLoading } = useLatestRates('ETH')
  console.log({ data })

  return (
    <>
      <div className="overflow-hidden border border-zinc-800 bg-transparent sm:rounded-sm">
        <ul role="list" className="divide-y divide-zinc-700">
          <li>
            <div className="flex-1 px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="truncate font-sans text-xs font-normal text-white">
                  Latest ETH Price
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                    {isLoading ? <>...</> : <>{formatUSD(data)}</>}
                  </p>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="flex hover:bg-black">
              <div className="flex-none-1 w-14">
                <div className="p-4 text-white sm:px-6">
                  <ETHIcon />
                </div>
              </div>
              <div className="flex-1 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-md truncate font-sans font-semibold text-zinc-500">
                    Sell $1400 ETH Call
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="truncate font-sans text-xs font-normal text-white">
                    Contracts
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                      {builtStrikeToClose
                        ? fromBigNumber(builtStrikeToClose.size)
                        : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="truncate font-sans text-xs font-normal text-white">
                    P&L
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                      $1001.23
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className="flex-1 px-4 py-6 sm:px-6">
              <div className="flex items-center justify-between pt-2">
                <p className="truncate font-sans text-xs font-semibold text-white">
                  Closing Fees
                </p>
                <div className="ml-2 flex flex-shrink-0">
                  <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                    $120.12
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div className="justify-stretch mt-6 flex flex-col">
        <Button
          label={'Close Position'}
          isLoading={false}
          variant={'action'}
          radius={'xs'}
          size={'full'}
          onClick={() => console.log('test')}
        />
      </div>
    </>
  )
}
