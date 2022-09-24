import { UserAction } from '../../queries/portfolio/useUserPortfolio'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'
import EmptyState from './EmptyState'

export default function Positions({ positions }: { positions: any }) {
  // positions in vaults

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Postions</h1>
        </div>
      </div>
      <div className="-mx-4 mt-8  overflow-hidden border border-zinc-700 bg-zinc-800 ring-1 ring-zinc-700 ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        {positions?.length > 0 ? (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800">
              <tr>
                <th
                  scope="col"
                  className="text-md hidden px-4 py-6 text-left font-semibold text-white"
                >
                  View Transaction
                </th>
                <th
                  scope="col"
                  className="text-md hidden px-4 py-6 text-left font-semibold text-white lg:table-cell"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="text-md hidden px-4 py-6 text-left font-semibold text-white"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="text-md hidden px-4 py-6 text-left font-semibold text-white"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="text-md hidden px-4 py-6 text-left font-semibold text-white"
                >
                  Vault
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {positions.map((action: UserAction) => (
                <tr key={action.id}>
                  <td className="text-md hidden whitespace-nowrap py-8 px-4 font-medium text-zinc-200 sm:pl-6">
                    {action.txhash}
                  </td>
                  <td className="text-md whitespace-nowrap py-8 px-4 font-medium text-zinc-200 lg:table-cell">
                    {action.timestamp
                      ? new Date(fromBigNumber(action.timestamp))
                      : ''}
                  </td>
                  <td className="text-md whitespace-nowrap py-8 px-4 font-medium text-zinc-200">
                    {action.isDeposit}
                  </td>
                  <td className="text-md whitespace-nowrap py-8 px-4 font-medium text-zinc-200">
                    {formatUSD(fromBigNumber(action.amount))}
                  </td>
                  <td className="text-md whitespace-nowrap py-8 px-4 font-medium text-zinc-200">
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
