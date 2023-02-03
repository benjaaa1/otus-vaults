import { useVaultManagerContext } from '../../../../context'
import { formatUSD, fromBigNumber } from '../../../../utils/formatters/numbers'
import { VaultTrade } from '../../../../utils/types/vault'
import BTCIcon from '../../../UI/Components/Icons/Color/BTC'
import ETHIcon from '../../../UI/Components/Icons/Color/ETH'
import { Cell } from '../../../UI/Components/Table/Cell'
import { HeaderCell, HeaderDeviceCellVariant } from '../../../UI/Components/Table/HeaderCell'
import Table from '../../../UI/Components/Table/Table'

export default function Signal() {

  const { toggleToHedge, toggleToClose } = useVaultManagerContext()

  return (
    <div>
      signal (only appears if public)
      -let users know your next markets
      -let users know your next direction
      -let users know your next trade period intention
      -let users know your next trade types
    </div>
  )
}

