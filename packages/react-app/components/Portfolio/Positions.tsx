import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useUserPortfolio } from '../../queries/portfolio/useUserPortfolio'
import { formatUSD, fromBigNumber } from '../../utils/formatters/numbers'
import { Cell } from '../UI/Components/Table/Cell'
import { HeaderCell } from '../UI/Components/Table/HeaderCell'
import Table from '../UI/Components/Table/Table'
import has from 'lodash/has'

type VaultUserPosition = {
  [key: string]: Position
}

type Position = {
  active: boolean
  vault: string
  balance: number
  apy: number
}

export default function Positions() {
  // positions in vaults
  const router = useRouter()

  const handleVaultClick = (e: any, href: string) => {
    e.preventDefault()
    router.push(`/vault/${href}`)
  }

  const { data, isLoading } = useUserPortfolio();

  const [positions, setPositions] = useState<Position[]>([]);

  const formatUserVaultActions = useCallback(() => {
    if (data?.userActions && data?.userActions.length > 0) {
      let _vaultPositions: VaultUserPosition = data?.userActions.reduce((accum: VaultUserPosition, action) => {
        let { vault: { id } } = action;
        if (accum.hasOwnProperty(id)) {
          let existingPosition = accum[id];
          let { balance: existingBalance } = existingPosition;
          let { amount, isDeposit } = action;
          let balance = isDeposit ? fromBigNumber(amount) + existingBalance : existingBalance - fromBigNumber(amount);
          let position = {
            vault: id,
            active: true,
            balance,
            apy: 0
          }
          return { ...accum, [id]: position }
        } else {
          let { amount, isDeposit } = action;
          let balance = isDeposit ? fromBigNumber(amount) + 0 : 0 - fromBigNumber(amount);
          let position = {
            vault: id,
            active: true,
            balance,
            apy: 0
          }
          return { ...accum, [id]: position }
        }
      }, {});

      let _positions: Position[] = Object.values(_vaultPositions);
      setPositions(_positions);
    } else {
      setPositions([])
    }
  }, [data]);

  useEffect(() => {
    formatUserVaultActions();
  }, [data])

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Current Vaults</h1>
        </div>
      </div>
      <div className="mt-6">
        <Table
          variant="default"
          headers={
            <tr>
              {['Active', 'Vault', 'Balance in Vault', 'APY'].map(
                (column, i) => {
                  return <HeaderCell key={i} variant="default" label={column} />
                }
              )}
            </tr>
          }
        >
          {positions.map((position: Position, index: number) => {
            return (
              <tr key={index}>
                <Cell
                  variant="default"
                  label={position.active ? 'Yes' : 'False'}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={formatUSD(position.balance)}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={'View Vault'}
                  isButton={true}
                  onClick={(e: React.MouseEvent<HTMLElement>) => handleVaultClick(e, position.vault)}
                />
                <Cell
                  variant="default"
                  label={position.apy}
                  isButton={false}
                />
              </tr>
            )
          })}
        </Table>
      </div>
    </div>
  )
}
