import { UserAction } from '../../queries/portfolio/useUserPortfolio'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'
import EmptyState from './EmptyState'

export default function Transactions({ actions }: { actions: any }) {
  // all useractions
  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Transactions</h1>
        </div>
      </div>
      <div className="-mx-4 mt-8  overflow-hidden border border-zinc-700 bg-zinc-800 ring-1 ring-zinc-700 ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        {actions?.length > 0 ? (
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th
                  scope="col"
                  className="text-md px-4 py-6 text-left font-semibold text-white"
                >
                  View Transaction
                </th>
                <th
                  scope="col"
                  className="text-md px-4 py-6 text-left font-semibold text-white lg:table-cell"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="text-md px-4 py-6 text-left font-semibold text-white"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="text-md px-4 py-6 text-left font-semibold text-white"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="text-md px-4 py-6 text-left font-semibold text-white"
                >
                  Vault
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {actions.map((action: UserAction) => (
                <tr key={action.id}>
                  <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200">
                    {action.txhash}
                  </td>
                  <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200 lg:table-cell">
                    {action.timestamp
                      ? new Date(fromBigNumber(action.timestamp))
                      : ''}
                  </td>
                  <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200">
                    {action.isDeposit ? 'Deposit' : 'Withdraw'}
                  </td>
                  <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200">
                    {formatUSD(fromBigNumber(action.amount))}
                  </td>
                  <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200">
                    {action.vault}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No transactions"
            description="Start by joining a vault"
          />
        )}
      </div>
    </div>
  )
}
