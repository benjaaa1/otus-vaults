import { fromBigNumber } from '../../../../utils/formatters/numbers'
import {
  StrikeStrategy,
} from '../../../../queries/vaults/useVaultProducts'

export const StrikeStrategyInfo = ({ strikeStrategies }: { strikeStrategies: StrikeStrategy[] }) => {

  return <>
    {
      strikeStrategies.map(strikeStrategy => {
        const { targetDelta, maxDeltaGap, minVol, maxVol, maxVolVariance, optionType } = strikeStrategy;
        return <div className="grid grid-cols-7">
          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Option Type
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {optionType}
              </div>
            </div>
          </div>

          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Target Delta
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {fromBigNumber(targetDelta)}
              </div>
            </div>
          </div>

          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Max Delta Gap
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {fromBigNumber(maxDeltaGap)}
              </div>
            </div>
          </div>

          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Min Vol
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {fromBigNumber(minVol)}
              </div>
            </div>
          </div>

          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Max Vol
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {fromBigNumber(maxVol)}
              </div>
            </div>
          </div>

          <div>
            <div className="p-4">
              <div className="text-xxs font-normal uppercase text-zinc-300">
                Max Vol Variance
              </div>
              <div className="py-2 font-mono text-xl font-normal text-white">
                {fromBigNumber(maxVolVariance)}
              </div>
            </div>
          </div>

        </div>
      })
    }
  </>
}