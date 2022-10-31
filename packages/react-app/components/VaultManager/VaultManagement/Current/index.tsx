import { useVaultManagerContext } from '../../../../context'
import { VaultTrade } from '../../../../queries/myVaults/useMyVaults'
import { formatUSD, fromBigNumber } from '../../../../utils/formatters/numbers'
import { Cell } from '../../../UI/Components/Table/Cell'
import { HeaderCell } from '../../../UI/Components/Table/HeaderCell'
import Table from '../../../UI/Components/Table/Table'

const vaultInfo = {
  hedgeType: 0,
}

const vaultStrategy = {}

const hedgeStrategies = {}

const strikeStrategies = {}

const currentPositions = [
  {
    asset: 'sETH',
    strikeId: 180,
    positionId: 18,
    expiry: 'September 30, 11:00am',
    pandl: '$221.10',
  },
]

export default function Current({
  hedgeType,
  activeVaultTrades,
}: {
  hedgeType: number
  activeVaultTrades: VaultTrade[]
}) {
  const { toggleToHedge, toggleToClose } = useVaultManagerContext()

  // positions in vaults

  return (
    <Table
      variant="primary"
      headers={
        <tr>
          {[
            'Asset',
            'Type',
            'Strike Price',
            'Size',
            'Premium',
            'Close',
            'Hedge',
          ].map((column, i) => {
            return <HeaderCell key={i} variant="primary" label={column} />
          })}
        </tr>
      }
    >
      {activeVaultTrades.map((activeTrade) => (
        <tr key={fromBigNumber(activeTrade.positionId)}>
          <Cell variant="primary" label={'ETH'} isButton={false} />
          <Cell
            variant="primary"
            label={activeTrade.optionType}
            isButton={false}
          />
          <Cell
            variant="primary"
            label={formatUSD(fromBigNumber(activeTrade.strikePrice))}
            isButton={false}
          />
          <Cell
            variant="primary"
            label={fromBigNumber(activeTrade.size)}
            isButton={false}
          />
          <Cell
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
      return 'Static'
    case 3:
      return 'Dynamic'
    default:
      return 'No Hedge'
  }
}
