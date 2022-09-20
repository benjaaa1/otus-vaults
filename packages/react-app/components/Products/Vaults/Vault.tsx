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
      key={vault.id}
      className="relative flex items-center space-x-3 rounded-lg border border-gray bg-black px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-gray focus-within:ring-offset-2 hover:border-gray"
    >
      <div className="min-w-0 flex-1">
        <div
          key={vault.id}
          className="overflow-hidden rounded-lg px-2 py-2 shadow sm:p-2"
        >
          <dt className="truncate font-serif text-sm font-medium text-gray">
            {vault.name}
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-dark-gray">
            {vault.name}
          </dd>
        </div>

        {/* <p className="text-sm font-medium text-gray">{vault.name}</p>
        <p className="truncate text-sm text-gray">{vault.description}</p>
        <p className="truncate text-sm text-gray">{vault.strategy}</p>
        <p className="truncate text-sm text-gray">{vault.isPublic}</p>
        <p className="truncate text-sm text-gray">{vault.manager}</p>
        <p className="truncate text-sm text-gray">{vault.vaultCap}</p>
        <p className="truncate text-sm text-gray">{vault.asset}</p> */}
        <button
          onClick={(e) => handleVaultClick(e, `vault/${vault.id}`)}
          type="button"
          className="inline-flex items-center rounded-full border border-transparent bg-green px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-dark-gray focus:outline-none focus:ring-2 focus:ring-dark-gray focus:ring-offset-2"
        >
          View Vault
        </button>
      </div>
    </div>
  )
}

export default Vault
