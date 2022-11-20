import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { MAX_BN, ZERO_BN } from '../../../constants/bn'
import { useWeb3Context } from '../../../context'
import { useContracts, useOtusVaultContracts } from '../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../hooks/TransactionNotifier'
import { lyra } from '../../../queries/lyra/useLyra'
import { Vault } from '../../../queries/vaults/useVaultProducts'
import {
  formatNumber,
  formatUSD,
  fromBigNumber,
} from '../../../utils/formatters/numbers'
import { Button } from '../../UI/Components/Button'
import { Input } from '../../UI/Components/Input/Input'

export default function Withdraw({ vault }: { vault: Vault }) {
  const { signer, address, network } = useWeb3Context()

  const otusContracts = useOtusVaultContracts()

  const monitorTransaction = useTransactionNotifier()

  const otusVaultContract = otusContracts ? otusContracts[vault?.id] : null

  // const [isDepositLoading, setIsDepositLoading] = useState(false)
  // const [isApproveLoading, setIsApproveLoading] = useState(false)
  const [hasDeposit, setHasDeposit] = useState(false)
  const [canTransact, setCanTransact] = useState(false)
  const [amount, setAmount] = useState(0)

  const [balanceAmount, setBalanceAmount] = useState<BigNumber>(ZERO_BN)

  const checkBalanceStatus = useCallback(async () => {
    if (otusVaultContract != null && address != null) {
      const [heldByAccount, heldByVault] =
        await otusVaultContract.shareBalances(address)

      const bal = await otusVaultContract.balanceOf(address)

      if (fromBigNumber(heldByAccount) > 0) {
        setHasDeposit(true)
      } else {
        setHasDeposit(false)
      }
      setBalanceAmount(heldByAccount)
    }
  }, [otusVaultContract, address])

  useEffect(() => {
    try {
      checkBalanceStatus()
    } catch (error) {
      console.log({ error })
    }
  }, [otusVaultContract, address])

  useEffect(() => {
    if (network?.chainId == 69 && signer != null) {
      setCanTransact(true)
    }
  }, [signer, network])

  // add log events
  return (
    <div className="p-8">
      <div>
        <label
          htmlFor="price"
          className="hidden text-sm font-medium text-gray-700"
        >
          Price
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-zinc-500 sm:text-sm">$</span>
          </div>
          <Input
            isDisabled={balanceAmount.eq(ZERO_BN)}
            type="number"
            id="amount"
            onChange={(e) => {
              setAmount(parseInt(e.target.value))
            }}
            value={amount}
            placeholder="0.00"
            radius={'xs'}
            variant={'default'}
            style={'pl-6'}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-9">
            <span className="text-zinc-500 sm:text-sm" id="price-currency">
              sUSD
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-between">
        <div className="text-xs text-white">Wallet Balance</div>
        <div className="text-xs text-white">
          {formatUSD(fromBigNumber(balanceAmount || ZERO_BN))}
        </div>
      </div>
      <div className="py-6 text-center text-xs text-white">
        Your deposit will be deployed in the Vault’s weekly strategy on Friday
        at 11am UTC
      </div>
      <div className="justify-stretch mt-6 flex flex-col">
        {/* {canTransact && isApproved ? (
          <Button
            isDisabled={amount <= 0}
            label={'Deposit'}
            isLoading={isDepositLoading}
            variant={'action'}
            radius={'xs'}
            size={'full'}
            onClick={handleDepositQuote}
          />
        ) : canTransact && !isApproved ? (
          <Button
            label={'Approve'}
            isLoading={isApproveLoading}
            variant={'action'}
            radius={'xs'}
            size={'full'}
            onClick={handleClickApproveQuote}
          />
        ) : !canTransact ? (
          <Button
            label={'Wallet Connect'}
            isLoading={false}
            variant={'action'}
            radius={'xs'}
            size={'full'}
            onClick={() => console.log('deposit')}
          />
        ) : null} */}
      </div>
    </div>
  )
}
