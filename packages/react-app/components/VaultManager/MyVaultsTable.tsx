import { useRouter } from 'next/router'
import { CURRENCY_BY_ADDRESS } from '../../constants/currency'
import { useWeb3Context } from '../../context'

import { useMyVaults, Vault } from '../../queries/myVaults/useMyVaults'
import { formatDate } from '../../utils/formatters/dates'
import { Cell } from '../UI/Components/Table/Cell'
import { HeaderCell } from '../UI/Components/Table/HeaderCell'
import Table from '../UI/Components/Table/Table'

export default function MyVaultsTable() {
  const { network } = useWeb3Context()
  console.log({ network })

  const { data, isLoading } = useMyVaults()
  const vaults = data?.vaults || []

  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(`/vault-manager/${href}`)
  }

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Vault Management</h1>
        </div>
      </div>
      <div className="mt-6">
        <Table
          variant="default"
          headers={
            <tr>
              {[
                'Active',
                'Timestamp',
                'Name',
                'Asset',
                'Is Public',
                'Manage',
              ].map((column, i) => {
                return <HeaderCell key={i} variant="default" label={column} />
              })}
            </tr>
          }
        >
          {vaults.map((vault: Vault) => {
            return (
              <tr key={vault.id}>
                <Cell variant="default" label={vault.isActive ? 'Yes' : 'No'} />
                <Cell
                  variant="default"
                  label={vault.createdAt ? formatDate(vault.createdAt) : ''}
                />

                <Cell variant="default" label={vault.name} isButton={false} />
                <Cell
                  variant="default"
                  label={
                    CURRENCY_BY_ADDRESS[network?.chainId || 10][vault.id] ||
                    'N/A'
                  }
                  isButton={false}
                />
                <Cell variant="default" label={vault.isPublic ? 'Yes' : 'No'} />

                <Cell
                  variant="default"
                  label={'View'}
                  isButton={true}
                  onClick={(e) => handleVaultClick(e, vault.id)}
                />
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
