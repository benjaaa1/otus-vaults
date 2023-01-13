import { fromBigNumber } from '../../../../utils/formatters/numbers'
import Table from '../../../UI/Components/Table/Table'
import { HeaderCell } from '../../../UI/Components/Table/HeaderCell'
import { Cell } from '../../../UI/Components/Table/Cell'
import { StrikeStrategy } from '../../../../utils/types/vault'

export const StrikeStrategyInfo = ({ strikeStrategies }: { strikeStrategies: StrikeStrategy[] }) => {

  return <div className="mt-6">
    <Table
      variant="primary"
      headers={
        <tr>
          {['Option Type', 'Target Delta', 'Max Delta Gap', 'Min Vol', 'Max Vol', 'Max Vol Variance'].map(
            (column, i) => {
              return <HeaderCell key={i} variant="default" label={column} />
            }
          )}
        </tr>
      }
    >
      {
        strikeStrategies.map((strikeStrategy, index) => {
          const { targetDelta, maxDeltaGap, minVol, maxVol, maxVolVariance, optionType } = strikeStrategy;

          return (
            <tr key={index}>
              <Cell
                variant="default"
                label={optionType.toString()}
                isButton={false}
              />
              <Cell
                variant="default"
                label={fromBigNumber(targetDelta)}
                isButton={false}
              />
              <Cell
                variant="default"
                label={fromBigNumber(maxDeltaGap)}
                isButton={false}
              />
              <Cell
                variant="default"
                label={fromBigNumber(minVol)}
                isButton={false}
              />
              <Cell
                variant="default"
                label={fromBigNumber(maxVol)}
                isButton={false}
              />
              <Cell
                variant="default"
                label={fromBigNumber(maxVolVariance)}
                isButton={false}
              />
            </tr>
          )

        })
      }
    </Table>

  </div>
}