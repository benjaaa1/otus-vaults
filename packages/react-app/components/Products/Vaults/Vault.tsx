import { useRouter } from 'next/router'
import React from 'react'
import { Vault } from '../../../queries/myVaults/useMyVaults'

const Vault = ({ vault }: { vault: Vault }) => {
  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <div
      onClick={(e) => handleVaultClick(e, `vault/${vault.id}`)}
      key={vault.id}
      className="focus-within:ring-gray relative flex cursor-pointer items-center space-x-1 rounded-lg border border-transparent bg-gradient-to-br from-purple-600 to-blue-500 px-1 py-1 shadow-sm
      focus-within:ring-2 focus-within:ring-offset-2 hover:border hover:border-purple-600 hover:shadow-2xl hover:shadow-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:text-white dark:focus:ring-blue-800"
    >
      <div className="min-w-0 flex-1 rounded-lg bg-zinc-800 p-4">
        <div key={vault.id} className="overflow-hidden px-2 py-2 sm:p-2">
          <dt className="truncate font-mono text-3xl font-bold text-white">
            {vault.name}
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-200">
            {vault.description}
          </dd>
        </div>

        {/* <p className="text-sm font-medium text-gray">{vault.name}</p>
        <p className="truncate text-sm text-gray">{vault.description}</p>
        <p className="truncate text-sm text-gray">{vault.strategy}</p>
        <p className="truncate text-sm text-gray">{vault.isPublic}</p>
        <p className="truncate text-sm text-gray">{vault.manager}</p>
        <p className="truncate text-sm text-gray">{vault.vaultCap}</p>
        <p className="truncate text-sm text-gray">{vault.asset}</p> */}
      </div>
    </div>
  )
}

export default Vault
