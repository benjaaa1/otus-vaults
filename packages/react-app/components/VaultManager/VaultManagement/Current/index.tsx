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

export default function Current() {
  // positions in vaults

  return (
    <Table
      variant="primary"
      headers={
        <tr>
          {['Asset', 'Strike Id', 'Expiry', 'P&L', 'Close', 'Hedge'].map(
            (column, i) => {
              return <HeaderCell key={i} variant="primary" label={column} />
            }
          )}
        </tr>
      }
    >
      {currentPositions.map((position) => (
        <tr key={position.positionId}>
          <Cell variant="primary" label={position.asset} isButton={false} />
          <Cell variant="primary" label={position.strikeId} isButton={false} />
          <Cell variant="primary" label={position.expiry} isButton={false} />
          <Cell variant="primary" label={position.pandl} isButton={false} />
          <Cell variant="primary" label={'Close'} isButton={true} />
          <Cell variant="primary" label={'Hedge'} isButton={true} />
        </tr>
      ))}
    </Table>
  )
}
