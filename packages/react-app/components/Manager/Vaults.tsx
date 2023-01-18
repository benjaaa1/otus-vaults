import { useRouter } from 'next/router'
import { CURRENCY_BY_ADDRESS } from '../../constants/currency'
import { useWeb3Context } from '../../context'

import { useMyVaults } from '../../queries/myVaults/useMyVaults'
import { formatDate } from '../../utils/formatters/dates'
import { Vault } from '../../utils/types/vault'
import { Cell } from '../UI/Components/Table/Cell'
import { HeaderCell, HeaderDeviceCellVariant } from '../UI/Components/Table/HeaderCell'
import Table from '../UI/Components/Table/Table'

type VaultManagementHeader = {
  name: string
  deviceVariant: HeaderDeviceCellVariant
}

const VaultManagementHeaders: VaultManagementHeader[] = [
  {
    name: 'Active',
    deviceVariant: 'default',
  },
  {
    name: 'Timestamp',
    deviceVariant: 'large',
  },
  {
    name: 'Name',
    deviceVariant: 'default',
  },
  {
    name: 'Asset',
    deviceVariant: 'large',
  },
  {
    name: 'Is Public',
    deviceVariant: 'large',
  },
  {
    name: 'Manage',
    deviceVariant: 'default',
  }
];

export default function ManagerVaults() {
  const { network } = useWeb3Context()

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
              {VaultManagementHeaders.map((column, i) => {
                return <HeaderCell key={i} variant="default" label={column.name} deviceVariant={column.deviceVariant} />
              })}
            </tr>
          }
        >
          {vaults.map((vault: Vault) => {
            return (
              <tr key={vault.id}>
                <Cell variant="default" label={vault.isActive ? 'Yes' : 'No'} />
                <Cell
                  deviceVariant='large'
                  variant="default"
                  label={vault.createdAt ? formatDate(vault.createdAt) : ''}
                />

                <Cell variant="default" label={vault.name} isButton={false} />
                <Cell
                  deviceVariant='large'
                  variant="default"
                  label={
                    CURRENCY_BY_ADDRESS[network?.chainId || 10][vault.id] ||
                    'N/A'
                  }
                  isButton={false}
                />
                <Cell deviceVariant='large' variant="default" label={vault.isPublic ? 'Yes' : 'No'} />
                <Cell
                  variant="default"
                  label={'View'}
                  isButton={true}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleVaultClick(e, vault.id)}
                />
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
