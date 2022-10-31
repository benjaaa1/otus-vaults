import { UserAction } from '../../queries/portfolio/useUserPortfolio'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'
import { Cell } from '../UI/Components/Table/Cell'
import { HeaderCell } from '../UI/Components/Table/HeaderCell'
import Table from '../UI/Components/Table/Table'
import EmptyState from './EmptyState'

export default function Positions() {
  // positions in vaults
  const positions = []

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Current Vaults</h1>
        </div>
      </div>
      <div className="mt-6">
        <Table
          variant="default"
          headers={
            <tr>
              {['Active', 'Vault', 'Balance in Vault', 'APY'].map(
                (column, i) => {
                  return <HeaderCell key={i} variant="default" label={column} />
                }
              )}
            </tr>
          }
        >
          {positions.map((position: any, index: number) => {
            ;<tr key={index}>
              <Cell
                variant="default"
                label={position.txhash}
                isButton={false}
              />
              <Cell
                variant="default"
                label={position.timestamp}
                isButton={false}
              />
              <Cell
                variant="default"
                label={position.isDeposit}
                isButton={false}
              />
              <Cell
                variant="default"
                label={formatUSD(fromBigNumber(position.amount))}
                isButton={false}
              />
              <Cell variant="default" label={position.vault} isButton={false} />
            </tr>
          })}
        </Table>
      </div>
    </div>
  )
}
