import { useEffect, useState } from 'react'
import { useVaultManagerContext } from '../../../../context/VaultManagerContext'
import { LyraBoard, LyraStrike } from '../../../../queries/lyra/useLyra'
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
  selectedStrikes: []
  selectedOptionType: number
}) {
  const { toggleTrade } = useVaultManagerContext()

  const [activeIds, setActiveIds] = useState<Record<string, boolean>>({})

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
              setActiveIds((_activeIds: Record<string, boolean>) => {
                if (
                  Object.hasOwn(
                    _activeIds,
                    `${strike.id}-${selectedOptionType}`
                  )
                ) {
                  return {
                    ..._activeIds,
                    [`${strike.id}-${selectedOptionType}`]: false,
                  }
                } else {
                  return {
                    ..._activeIds,
                    [`${strike.id}-${selectedOptionType}`]: true,
                  }
                }
              })
              toggleTrade({ ...strike, selectedOptionType })
            }}
          />
        </tr>
      ))}
    </Table>
  )
}
