import { VaultTrade } from '../../../queries/myVaults/useMyVaults'
import { useWeb3Context } from '../../../context'

import { formatUSD, fromBigNumber } from '../../../utils/formatters/numbers'
import { getBlockExplorerUrl } from '../../../utils/getBlockExplorer'
import { Cell } from '../../UI/Components/Table/Cell'
import { HeaderCell } from '../../UI/Components/Table/HeaderCell'
import Table from '../../UI/Components/Table/Table'

export default function TradeTransactions({ vaultTrades }: { vaultTrades: VaultTrade[] }) {
  const { network } = useWeb3Context()

  return (
    <div className="relative pt-8 pb-8 font-sans">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-white">Current Trades</h1>
        </div>
      </div>
      <div className="mt-6">
        <Table
          variant="default"
          headers={
            <tr>
              {['View Transaction', 'Expiry', 'Strike', 'Option Type', 'Size'].map(
                (column, i) => {
                  return <HeaderCell key={i} variant="default" label={column} />
                }
              )}
            </tr>
          }
        >
          {vaultTrades?.map((trade: VaultTrade) => {
            return (
              <tr key={trade.id}>
                <Cell
                  variant="default"
                  label={'View TX'}
                  isButton={true}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    const url = `${getBlockExplorerUrl(
                      network?.chainId || 10
                    )}tx/${trade.txhash}`
                    window.open(url, '_blank')
                  }}
                />
                <Cell
                  variant="default"
                  label={trade.expiry}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={formatUSD(fromBigNumber(trade.strikePrice))}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={trade.optionType}
                  isButton={false}
                />
                <Cell
                  variant="default"
                  label={fromBigNumber(trade.size)}
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
