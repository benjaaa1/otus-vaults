import { useRouter } from 'next/router'
import React from 'react'
import { useVaultProducts } from '../../../queries/vaults/useVaultProducts'
import { Spinner } from '../../Common/UIElements/Spinner'
import Vault from './Vault'

const Vaults = () => {
  const { data, isLoading } = useVaultProducts()

  const vaults = data?.vaults || []

  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 gap-6 pt-10 sm:grid-cols-3">
          {vaults?.length ? (
            vaults.map((vault) => <Vault key={vault.id} vault={vault} />)
          ) : (
            <div>empty ui here</div>
          )}
        </div>
      )}
    </>
  )
}

export default Vaults
