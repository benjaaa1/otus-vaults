import { useCallback, useEffect, useState } from 'react'
import { useVaultManagerContext, useWeb3Context } from '../../../../context'
import { useLatestRates } from '../../../../queries/synth/useLatestRates'
import {
  buildTradeTitle
} from '../../../../utils/formatters/trades'
import {
  formatNumber,
  formatUSD,
  fromBigNumber,
} from '../../../../utils/formatters/numbers'
import { Button } from '../../../UI/Components/Button'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'
import { getLyra } from '../../../../queries/lyra/useLyra';
import { ZERO_BN } from '../../../../constants/bn'


export default function CloseExecute() {
  const { builtStrikeToClose } = useVaultManagerContext()

  const [closeFee, setCloseFee] = useState(ZERO_BN);
  const [forceCloseFee, setForceCloseFee] = useState(ZERO_BN);
  const [isForceClose, setIsForceClose] = useState(false);
  const lyra = getLyra();

  const calculateCloseCosts = useCallback(async () => {
    if (builtStrikeToClose.strikeId != null) {
      const { strikeId, isCall, isLong, size } = builtStrikeToClose;
      // get strike
      const strike = await lyra.strike('ETH', strikeId);
      // get quote 
      const quote = await strike.quote(isCall, isLong, size);

      const { isForceClose: _isForceClose, fee, forceClosePenalty } = quote;

      setCloseFee(fee);
      setForceCloseFee(forceClosePenalty);
      setIsForceClose(_isForceClose);

    }
  }, [builtStrikeToClose])

  useEffect(() => {
    try {
      calculateCloseCosts()
    } catch (error) {
      console.log({ error })
    }
  }, [builtStrikeToClose])

  // get more position data in order to close 
  const { data, isLoading } = useLatestRates('ETH')

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
                    {isLoading ? <>...</> : <>{formatUSD(data || 0)}</>}
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
                    {buildTradeTitle(builtStrikeToClose.optionType, 'ETH', builtStrikeToClose.strikePrice)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="truncate font-sans text-xs font-normal text-white">
                    Contracts
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                      {builtStrikeToClose && builtStrikeToClose.position
                        ? fromBigNumber(builtStrikeToClose.position.size)
                        : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="truncate font-sans text-xs font-normal text-white">
                    Profit / Loss
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                      {builtStrikeToClose && builtStrikeToClose.position
                        ? formatUSD(fromBigNumber(builtStrikeToClose.position.settlementPnl))
                        : null}
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
                    {fromBigNumber(closeFee)}
                  </p>
                </div>
              </div>
            </div>
          </li>

          {
            isForceClose ?
              <li>
                <div className="flex-1 px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between pt-2">
                    <p className="truncate font-sans text-xs font-semibold text-white">
                      Force Close Penalty
                    </p>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="inline-flex font-mono text-xs font-normal leading-5 text-white">
                        {fromBigNumber(forceCloseFee)}
                      </p>
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
