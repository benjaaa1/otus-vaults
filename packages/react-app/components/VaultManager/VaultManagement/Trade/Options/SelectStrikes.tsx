import { useCallback, useEffect, useState } from 'react'
import { useVaultManagerContext } from '../../../../../context/VaultManagerContext'
import {
  fromBigNumber,
  formatPercentage,
  formatUSD,
} from '../../../../../utils/formatters/numbers'
import { LyraStrike } from '../../../../../utils/types/lyra'
import { Cell } from '../../../../UI/Components/Table/Cell'
import { HeaderCell, HeaderDeviceCellVariant } from '../../../../UI/Components/Table/HeaderCell'
import Table from '../../../../UI/Components/Table/Table'

type StrikeHeader = {
  name: string
  deviceVariant: HeaderDeviceCellVariant
}

const StrikesHeaders: StrikeHeader[] = [
  {
    name: 'Strike',
    deviceVariant: 'default',
  },
  {
    name: 'Break Even',
    deviceVariant: 'default',
  },
  {
    name: 'Implied Volatility',
    deviceVariant: 'large',
  },
  {
    name: 'Price',
    deviceVariant: 'default',
  }
]

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
          {StrikesHeaders.map(
            (column, i) => {
              return <HeaderCell key={i} deviceVariant={column.deviceVariant} variant="primary" label={column.name} />
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
            deviceVariant='large'
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
