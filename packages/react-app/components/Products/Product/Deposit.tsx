import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { MAX_BN, ZERO_BN } from '../../../constants/bn'
import { useWeb3Context } from '../../../context'
import { useBalance } from '../../../hooks/Balances'
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

export default function Deposit({ vault }: { vault: Vault }) {
  const { signer, address, network } = useWeb3Context()
  const contracts = useContracts()
  const otusContracts = useOtusVaultContracts()

  const monitorTransaction = useTransactionNotifier()

  const susdContract = contracts ? contracts['SUSD'] : null

  const otusVaultContract = otusContracts ? otusContracts[vault?.id] : null

  const balance = useBalance()

  const [isDepositLoading, setIsDepositLoading] = useState(false)
  const [isApproveLoading, setIsApproveLoading] = useState(false)
  const [isApproved, setApproved] = useState(false)
  const [canTransact, setCanTransact] = useState(false)
  const [amount, setAmount] = useState(0)

  const [allowanceAmount, setAllowanceAmount] = useState<BigNumber>(ZERO_BN)

  const checkAllowanceStatus = useCallback(async () => {
    if (
      susdContract != null &&
      susdContract.allowance != null &&
      address != null &&
      vault
    ) {
      console.log({ address, vault })
      const allowanceStatus = await susdContract.allowance(address, vault.id)
      if (fromBigNumber(allowanceStatus) > 0) {
        setApproved(true)
      } else {
        setApproved(false)
      }
      setAllowanceAmount(allowanceStatus)
    }
  }, [susdContract, address, vault, isApproveLoading])

  useEffect(() => {
    try {
      checkAllowanceStatus()
    } catch (error) {
      console.log({ error })
    }
  }, [susdContract, address, vault])

  useEffect(() => {
    if (
      (network?.chainId == 420 ||
        network?.chainId == 10 ||
        network?.chainId == 31337) &&
      signer != null
    ) {
      setCanTransact(true)
    }
  }, [signer, network])

  // add log events
  const handleClickApproveQuote = useCallback(async () => {
    if (susdContract == null || vault == null) {
      console.warn('Vault does not exist')
      return null
    }

    setIsApproveLoading(true)

    const tx = await susdContract.approve(vault.id, MAX_BN)

    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            setIsApproveLoading(false)
            setApproved(true)
          }, 5 * 1000)
        },
      })
    }
  }, [susdContract, vault, monitorTransaction])

  const handleDepositQuote = useCallback(async () => {
    if (otusVaultContract == null || vault == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    setIsDepositLoading(true)

    const tx = await otusVaultContract.deposit(parseUnits(amount.toString()))
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(() => {
            setIsDepositLoading(false)
            setAmount(0)
            balance.refetch()
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract, vault, monitorTransaction, amount])

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
            isDisabled={allowanceAmount.eq(ZERO_BN) && !isApproved}
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
          {formatUSD(fromBigNumber(balance.data || ZERO_BN))}
        </div>
      </div>
      <div className="py-6 text-center text-xs text-white">
        Your deposit will be deployed in the Vault’s weekly strategy on Friday
        at 11am UTC
      </div>
      <div className="justify-stretch mt-6 flex flex-col">
        {canTransact && isApproved ? (
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
        ) : null}
      </div>
    </div>
  )
}
