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
    size: 10,
    expiry: 'September 30, 11:00am',
    pandl: '$221.10',
  },
]

export default function Current() {
  // positions in vaults

  return (
    <div>
      <div className="overflow-hidden bg-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800">
            <tr>
              <th
                scope="col"
                className="p-2 text-left text-sm font-semibold text-zinc-400 sm:pl-2"
              >
                Asset
              </th>
              <th
                scope="col"
                className="hidden p-2 text-left text-sm font-semibold text-zinc-400 sm:table-cell"
              >
                StrikeId
              </th>
              <th
                scope="col"
                className="hidden p-2 text-left text-sm font-semibold text-zinc-400 lg:table-cell"
              >
                Size
              </th>
              <th
                scope="col"
                className="p-2 text-left text-sm font-semibold text-zinc-400"
              >
                Expiry
              </th>

              <th
                scope="col"
                className="p-2 text-left text-sm font-semibold text-zinc-400"
              >
                P&L
              </th>
              <th
                scope="col"
                className="p-2 text-left text-sm font-semibold text-zinc-400"
              >
                Close
              </th>
              <th
                scope="col"
                className="p-2 text-left text-sm font-semibold text-zinc-400"
              >
                Hedge
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {currentPositions.map((position) => (
              <tr key={position.positionId}>
                <td className="whitespace-nowrap p-2 text-sm font-medium text-zinc-200 sm:pl-6">
                  {position.asset}
                </td>
                <td className="hidden whitespace-nowrap p-2 text-sm text-zinc-200 sm:table-cell">
                  {position.strikeId}
                </td>
                <td className="hidden whitespace-nowrap p-2 text-sm text-zinc-200 lg:table-cell">
                  {position.size}
                </td>
                <td className="whitespace-nowrap p-2 text-sm text-zinc-200">
                  {position.expiry}
                </td>
                <td className="whitespace-nowrap p-2 text-sm text-zinc-200">
                  {position.pandl}
                </td>
                <td className="whitespace-nowrap p-2 text-right text-sm font-medium">
                  <button
                    onClick={() => console.log(position.positionId)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Close
                  </button>
                </td>
                <td className="whitespace-nowrap p-2 text-right text-sm font-medium">
                  <button
                    onClick={() => console.log(position.positionId)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Hedge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
