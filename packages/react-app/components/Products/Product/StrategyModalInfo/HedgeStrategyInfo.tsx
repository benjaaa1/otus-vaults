import { fromBigNumber } from '../../../../utils/formatters/numbers'
import { DynamicHedgeStrategy } from '../../../../queries/myVaults/useMyVaults';

export const HedgeStrategyInfo = ({ hedgeType, strategy }: { hedgeType: number, strategy: DynamicHedgeStrategy }) => {
  console.log({ hedgeType, strategy })
  if (hedgeType == 1 || hedgeType == null) {
    return <div className='text-md text-white p-4'>
      Hedging controlled by manager.
    </div>
  }

  const { threshold, maxLeverageSize, maxHedgeAttempts } = strategy;


  return (
    <div className="grid grid-cols-3">
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Delta Threshold
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(threshold)}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Leverage Size
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(maxLeverageSize)}
          </div>
        </div>
      </div>
      <div>
        <div className="p-4">
          <div className="text-xxs font-normal uppercase text-zinc-300">
            Max Hedge Attempts
          </div>
          <div className="py-2 font-mono text-xl font-normal text-white">
            {fromBigNumber(maxHedgeAttempts)}
          </div>
        </div>
      </div>
    </div>
  )
}