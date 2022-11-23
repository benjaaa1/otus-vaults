import { useCallback, useEffect, useState } from 'react'
import { useVaultManagerContext } from '../../../../context/VaultManagerContext'
import { LyraStrike } from '../../../../queries/lyra/useLyra'
import {
  fromBigNumber,
  formatPercentage,
  formatUSD,
} from '../../../../utils/formatters/numbers'
import { Cell } from '../../../UI/Components/Table/Cell'
import { HeaderCell } from '../../../UI/Components/Table/HeaderCell'
import Table from '../../../UI/Components/Table/Table'

export default function SelectStrikes({
  selectedStrikes,
  selectedOptionType,
}: {
  selectedStrikes: LyraStrike[]
  selectedOptionType: number
}) {
  const { builtTrades, toggleTrade } = useVaultManagerContext()

  const [activeIds, setActiveIds] = useState<Record<string, boolean>>({});

  const buildActiveIds = useCallback(() => {
    let _activeIds = builtTrades?.reduce((accum, trade) => {
      let prop = `${trade.id}-${selectedOptionType}`;
      return { ...accum, [prop]: true }
    }, {});
    setActiveIds(_activeIds);
  }, [builtTrades])

  useEffect(() => {
    buildActiveIds();
  }, [builtTrades])

  return (
    <Table
      variant="primary"
      headers={
        <tr>
          {['Strike', 'Break Even', 'Implied Volatility', 'Price'].map(
            (column, i) => {
              return <HeaderCell key={i} variant="primary" label={column} />
            }
          )}
        </tr>
      }
    >
      {selectedStrikes.map((strike: LyraStrike) => (
        <tr key={strike.id + selectedOptionType}>
          <Cell
            variant="primary"
            label={formatUSD(fromBigNumber(strike.strikePrice))}
            isButton={false}
          />
          <Cell
            variant="primary"
            label={formatUSD(fromBigNumber(strike.quote.breakEven))}
            isButton={false}
          />
          <Cell
            variant="primary"
            label={formatPercentage(fromBigNumber(strike.quote.iv), true)}
            isButton={false}
          />
          <Cell
            variant="primary"
            label={formatUSD(fromBigNumber(strike.quote.premium))}
            isButton={true}
            isSelected={activeIds[`${strike.id}-${selectedOptionType}`]}
            onClick={() => {
              toggleTrade({ ...strike, selectedOptionType })
            }}
          />
        </tr>
      ))}
    </Table>
  )
}
