import { fromBigNumber } from '../../../../utils/formatters/numbers'
import { HOUR_SEC } from '../../../../constants/period'
import {
  VaultStrategy,
} from '../../../../queries/vaults/useVaultProducts'

export const VaultStrategyInfo = ({ strategy }: { strategy: VaultStrategy }) => {
  const { collatPercent, collatBuffer, minTimeToExpiry, maxTimeToExpiry, minTradeInterval } = strategy
  return (
    <div className="grid grid-cols-5">
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Collateral Percent
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {`${fromBigNumber(collatPercent) * 100}%`}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Collateral Buffer
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {`${fromBigNumber(collatBuffer) * 100}%`}

          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Min. Time to Expiry (Hours)
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {minTimeToExpiry / HOUR_SEC}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Time to Expiry (Hours)
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {maxTimeToExpiry / HOUR_SEC}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Min Trade Interval (Minutes)
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {minTradeInterval / 60}
          </div>
        </div>
      </div>
    </div>
  )
}