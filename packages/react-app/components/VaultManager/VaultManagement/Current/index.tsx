import { useVaultManagerContext } from '../../../../context'
import { formatUSD, fromBigNumber } from '../../../../utils/formatters/numbers'
import { VaultTrade } from '../../../../utils/types/vault'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'
import { Cell } from '../../../UI/Components/Table/Cell'
import { HeaderCell, HeaderDeviceCellVariant } from '../../../UI/Components/Table/HeaderCell'
import Table from '../../../UI/Components/Table/Table'

type CurrentPositionHeader = {
  name: string
  deviceVariant: HeaderDeviceCellVariant
}

const CurrentPositionHeaders: CurrentPositionHeader[] = [
  {
    name: 'Asset',
    deviceVariant: 'default',
  },
  {
    name: 'Type',
    deviceVariant: 'large',
  },
  {
    name: 'Strike Price',
    deviceVariant: 'large',
  },
  {
    name: 'Size',
    deviceVariant: 'large',
  },
  {
    name: 'Premium',
    deviceVariant: 'large',
  },
  {
    name: 'Close',
    deviceVariant: 'default',
  },
  {
    name: 'Hedge',
    deviceVariant: 'default',
  },
];

export default function Current({
  hedgeType,
  activeVaultTrades,
}: {
  hedgeType: number
  activeVaultTrades: VaultTrade[]
}) {

  const { toggleToHedge, toggleToClose } = useVaultManagerContext()

  return (
    <Table
      variant="primary"
      headers={
        <tr>
          {CurrentPositionHeaders.map((column, i) => {
            return <HeaderCell key={i} variant="primary" deviceVariant={column.deviceVariant} label={column.name} />
          })}
        </tr>
      }
    >
      {activeVaultTrades.map((activeTrade) => (
        <tr key={activeTrade.positionId}>
          <Cell
            label={activeTrade.market === 'ETH' ? 'ETH' : 'BTC'}
            variant="primary"
            icon={
              activeTrade.market === 'ETH' ? <ETHIcon /> : <BTCIcon />
            }
            isIcon={true}
            isButton={false}
          />
          <Cell
            deviceVariant='large'
            variant="primary"
            label={activeTrade.optionType}
            isButton={false}
          />
          <Cell
            deviceVariant='large'
            variant="primary"
            label={formatUSD(fromBigNumber(activeTrade.strikePrice))}
            isButton={false}
          />
          <Cell
            deviceVariant='large'
            variant="primary"
            label={activeTrade.position != null ? fromBigNumber(activeTrade.position.size) : 'N/A'}
            isButton={false}
          />
          <Cell
            deviceVariant='large'
            variant="primary"
            label={formatUSD(fromBigNumber(activeTrade.premiumEarned))}
            isButton={false}
          />

          {/* <Cell variant="primary" label={activeTrade.pandl} isButton={false} /> */}
          <Cell
            variant="primary"
            label={'Close'}
            isButton={true}
            buttonSize={'fixed-xxs'}
            onClick={() => {
              toggleToClose(activeTrade)
            }}
          />

          {hedgeType == 1 ? ( // SIMPLE HEDGE - USER Controlled
            <Cell
              variant="primary"
              label={'Hedge'}
              isButton={true}
              buttonSize={'fixed-xxs'}
              onClick={() => {
                toggleToHedge(activeTrade)
              }}
            />
          ) : (
            <Cell
              variant="primary"
              label={getHedgeLabel(hedgeType)}
              isButton={false}
            />
          )}
        </tr>
      ))}
    </Table>
  )
}

const getHedgeLabel = (hedgeType: number): string => {
  switch (hedgeType) {
    case 0:
      return 'No Hedge'
    case 1:
      return 'Manager'
    case 2:
      return 'Dynamic'
    default:
      return 'No Hedge'
  }
}
