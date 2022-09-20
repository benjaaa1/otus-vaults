import { useRouter } from 'next/router'

import { Vault } from '../../queries/myVaults/useMyVaults'

export default function MyVaultsTable({ vaults }: { vaults: Vault[] }) {
  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div className="relative pt-8 pb-8">
      <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="divide-gray-300 min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="text-gray-900 hidden px-3 py-3.5 text-left text-sm font-semibold lg:table-cell"
              >
                Active
              </th>
              <th
                scope="col"
                className="text-gray-900 py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6"
              >
                Name
              </th>
              <th
                scope="col"
                className="text-gray-900 hidden px-3 py-3.5 text-left text-sm font-semibold sm:table-cell"
              >
                Description
              </th>
              <th
                scope="col"
                className="text-gray-900 px-3 py-3.5 text-left text-sm font-semibold"
              >
                Asset
              </th>
              <th
                scope="col"
                className="text-gray-900 px-3 py-3.5 text-left text-sm font-semibold"
              >
                Public
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-gray-200 divide-y bg-dark-gray">
            {vaults.map((vault) => (
              <tr key={vault.id}>
                <td className="text-gray-900 whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                  {vault.isActive ? <span>Yes</span> : <span>No</span>}
                </td>
                <td className="text-gray-900 whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                  {vault.name}
                </td>
                <td className="text-gray-500 hidden whitespace-nowrap px-3 py-4 text-sm sm:table-cell">
                  {vault.description}
                </td>
                <td className="text-gray-500 hidden whitespace-nowrap px-3 py-4 text-sm lg:table-cell">
                  {vault.isPublic ? <span>Yes</span> : <span>No</span>}
                </td>
                <td className="text-gray-500 hidden whitespace-nowrap px-3 py-4 text-sm lg:table-cell">
                  {vault.asset}
                </td>

                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <a
                    onClick={(e) =>
                      handleVaultClick(e, `vault-manager/${vault.id}`)
                    }
                    href="#"
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Manage
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
