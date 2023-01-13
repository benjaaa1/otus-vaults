import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { MAX_BN, ZERO_BN } from '../../../constants/bn'
import { useWeb3Context } from '../../../context'
import { useContracts, useOtusContracts } from '../../../hooks/Contracts'
import { useTransactionNotifier } from '../../../hooks/TransactionNotifier'
import {
  formatNumber,
  formatUSD,
  fromBigNumber,
  toBN,
} from '../../../utils/formatters/numbers'
import { Vault } from '../../../utils/types/vault'
import { Button } from '../../UI/Components/Button'
import { Input } from '../../UI/Components/Input/Input'

export default function Withdraw({ vault }: { vault: Vault | undefined }) {
  const { signer, address, network, connect } = useWeb3Context()

  const otusContracts = useOtusContracts()

  const monitorTransaction = useTransactionNotifier()

  const otusVaultContract = otusContracts && vault?.id ? otusContracts[vault?.id] : null


  const [hasDeposit, setHasDeposit] = useState(false)
  const [canTransact, setCanTransact] = useState(false)

  const [requestAmount, setRequestAmount] = useState(0)
  const [immediateAmount, setImmediateAmount] = useState(0)

  const [isLoading, setLoading] = useState(true)

  const [availableWithdrawalRequestAmount, setAvailableWithdrawalRequestAmount] = useState<BigNumber>(ZERO_BN)
  const [immediateWithdrawalAmount, setImmediateWithdrawalAmount] = useState<BigNumber>(ZERO_BN)
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false)

  const checkBalanceStatus = useCallback(async () => {
    if (otusVaultContract != null && address != null) {
      const [heldByAccount] =
        await otusVaultContract.shareBalances(address)

      const { amount } = await otusVaultContract.depositReceipts(address)

      if (fromBigNumber(heldByAccount) > 0 || fromBigNumber(amount) > 0) {
        setHasDeposit(true)
      } else {
        setHasDeposit(false)
      }
      setAvailableWithdrawalRequestAmount(heldByAccount)
      setImmediateWithdrawalAmount(amount)
    }

    setLoading(false);

  }, [otusVaultContract, address])

  useEffect(() => {
    try {
      checkBalanceStatus()
    } catch (error) {
      console.log({ error })
    }
  }, [otusVaultContract, address])

  useEffect(() => {
    if (network?.chainId && signer != null) {
      setCanTransact(true)
    }
  }, [signer, network]);

  const handleRequestWithdrawal = useCallback(async () => {
    if (otusVaultContract == null || vault == null || address == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    if (requestAmount == 0) {
      console.warn('Must be non zero amount')
      return null
    }

    setIsWithdrawLoading(true)

    const tx = await otusVaultContract.withdrawInstantly(parseUnits(immediateAmount.toString()), { gasLimit: 500000 })
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(async () => {
            setIsWithdrawLoading(false)
            setImmediateAmount(0)
            const { amount } = await otusVaultContract.depositReceipts(address)
            setImmediateWithdrawalAmount(amount)
          }, 5 * 1000)
        },
      })
    }

  }, [otusVaultContract, vault, address, requestAmount, monitorTransaction])

  const handleImmediateWithdrawal = useCallback(async () => {
    if (otusVaultContract == null || vault == null || address == null) {
      console.warn('Vault does not exist for deposit')
      return null
    }

    if (immediateAmount == 0) {
      console.warn('Must be non zero amount')
      return null
    }

    setIsWithdrawLoading(true)

    const tx = await otusVaultContract.withdrawInstantly(parseUnits(immediateAmount.toString()), { gasLimit: 500000 })
    if (tx) {
      monitorTransaction({
        txHash: tx.hash,
        onTxConfirmed: () => {
          setTimeout(async () => {
            setIsWithdrawLoading(false)
            setImmediateAmount(0)
            const { amount } = await otusVaultContract.depositReceipts(address)
            setImmediateWithdrawalAmount(amount)
          }, 5 * 1000)
        },
      })
    }
  }, [otusVaultContract, vault, address, immediateAmount, monitorTransaction])

  return (
    <div className="p-8  divide-y divide-zinc-500">
      {
        canTransact ?

          <>
            <div className="pb-10">
              <div className="py-2">
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
                    isDisabled={availableWithdrawalRequestAmount.eq(ZERO_BN)}
                    type="number"
                    id="amount"
                    onChange={(e) => {
                      setRequestAmount(parseInt(e.target.value))
                    }}
                    value={requestAmount}
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

                <div className="mt-2 flex flex-wrap justify-between">
                  <div className="text-xs text-white">Amount In Vault</div>
                  <div className="text-xs text-white">
                    {formatUSD(fromBigNumber(availableWithdrawalRequestAmount || ZERO_BN))}
                  </div>
                </div>
              </div>

              <Button
                isDisabled={requestAmount <= 0}
                label={'Request Withdrawal'}
                isLoading={isLoading}
                variant={'action'}
                radius={'xs'}
                size={'full-sm'}
                onClick={handleRequestWithdrawal}
              />
            </div>

            {/* withdraw immediately available  */}
            <div className="pt-10">
              <div className="py-2">
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
                    isDisabled={immediateWithdrawalAmount.eq(ZERO_BN)}
                    type="number"
                    id="amount"
                    onChange={(e) => {
                      setImmediateAmount(parseInt(e.target.value))
                    }}
                    value={immediateAmount}
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
                <div className="mt-2 flex flex-wrap justify-between">
                  <div className="text-xs text-white">Available</div>
                  <div className="text-xs text-white">
                    {formatUSD(fromBigNumber(immediateWithdrawalAmount || ZERO_BN))}
                  </div>
                </div>
              </div>
              <Button
                isDisabled={immediateAmount <= 0}
                label={'Immmediate Withdrawal'}
                isLoading={isLoading}
                variant={'action'}
                radius={'xs'}
                size={'full-sm'}
                onClick={handleImmediateWithdrawal}
              />

            </div>
          </> :
          <Button
            label={'Wallet Connect'}
            isLoading={false}
            variant={'action'}
            radius={'xs'}
            size={'full'}
            onClick={connect}
          />
      }



    </div>
  )
}
