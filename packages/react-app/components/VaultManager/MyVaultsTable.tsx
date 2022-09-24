import { useRouter } from 'next/router'

import { Vault } from '../../queries/myVaults/useMyVaults'

export default function MyVaultsTable({ vaults }: { vaults: Vault[] }) {
  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="-mx-4 mt-8 overflow-hidden border border-zinc-700 bg-zinc-800 ring-1 ring-zinc-700 ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className=" bg-zinc-800">
            <tr>
              <th
                scope="col"
                className="text-md hidden px-4 py-6 text-left font-semibold text-white lg:table-cell"
              >
                Active
              </th>
              <th
                scope="col"
                className="text-md px-4 py-6 text-left font-semibold text-zinc-400"
              >
                Name
              </th>
              <th
                scope="col"
                className="text-md px-4 py-6 text-left font-semibold text-zinc-400"
              >
                Description
              </th>
              <th
                scope="col"
                className="text-md px-4 py-6 text-left font-semibold text-zinc-400"
              >
                Asset
              </th>
              <th
                scope="col"
                className="text-md px-4 py-6 text-left font-semibold text-zinc-400"
              >
                Public
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Manage</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {vaults.map((vault, index) => (
              <tr key={vault.id}>
                <td className="text-md hidden whitespace-nowrap p-4 font-medium text-zinc-200 sm:pl-6 lg:table-cell">
                  {vault.isActive ? <span>Yes</span> : <span>No</span>}
                </td>
                <td className="text-md whitespace-nowrap p-4 font-medium text-zinc-200 sm:pl-6">
                  {vault.name}
                </td>
                <td className="text-md whitespace-nowrap p-4 text-zinc-200">
                  {vault.description}
                </td>
                <td className="text-md whitespace-nowrap p-4 text-zinc-200">
                  {vault.isPublic ? <span>Yes</span> : <span>No</span>}
                </td>
                <td className="text-md whitespace-nowrap p-4 text-zinc-200">
                  {vault.asset}
                </td>

                <td className="text-md whitespace-nowrap p-4 text-right font-medium">
                  <button
                    onClick={(e) =>
                      handleVaultClick(e, `vault-manager/${vault.id}`)
                    }
                    type="button"
                    className="text-md mr-2 mb-2 inline-flex items-center rounded-lg border border-emerald-600 bg-gradient-to-br from-emerald-600 to-blue-500 py-2 px-8 text-center font-sans font-light text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                  >
                    Manage
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
