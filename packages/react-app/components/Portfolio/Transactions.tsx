import { useRouter } from 'next/router'
import { useWeb3Context } from '../../context'
import {
  UserAction,
  useUserPortfolio,
} from '../../queries/portfolio/useUserPortfolio'
import { formatDate } from '../../utils/formatters/dates'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'
import { getBlockExplorerUrl } from '../../utils/getBlockExplorer'
import { Cell } from '../UI/Components/Table/Cell'
import { HeaderCell } from '../UI/Components/Table/HeaderCell'
import Table from '../UI/Components/Table/Table'

export default function Transactions() {
  const { network } = useWeb3Context()
  const { data, isLoading } = useUserPortfolio()
  const actions = data?.userActions || []

  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(`/vault/${href}`)
  }

  console.log({ actions })
  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Transactions</h1>
        </div>
      </div>
      <div className="mt-6">
        <Table
          variant="default"
          headers={
            <tr>
              {['View Transaction', 'Timestamp', 'Type', 'Amount', 'Vault'].map(
                (column, i) => {
                  return <HeaderCell key={i} variant="default" label={column} />
                }
              )}
            </tr>
          }
        >
          {actions?.map((action: UserAction) => {
            return (
              <tr key={action.id}>
                <Cell
                  variant="default"
                  label={'View TX'}
                  isButton={true}
                  onClick={(e) => {
                    const url = `${getBlockExplorerUrl(
                      network?.chainId || 10
                    )}tx/${action.txhash}`
                    window.open(url, '_blank')
                  }}
                />
                <Cell
                  variant="default"
                  label={action.timestamp ? formatDate(action.timestamp) : ''}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={action.isDeposit ? 'Deposit' : 'Withdraw'}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={formatUSD(fromBigNumber(action.amount))}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={'View Vault'}
                  isButton={true}
                  onClick={(e) => handleVaultClick(e, action.vault)}
                />
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
