import { Button } from '../../UI/Components/Button'
import { Input } from '../../UI/Components/Input/Input'

export default function Deposit() {
  // const execute = useTransaction()

  // const handleClickApprove = useCallback(async () => {
  //   if (!account) {
  //     console.warn('Account does not exist')
  //     return null
  //   }
  //   setIsApprovalLoading(true)
  //   const tx = await account.approveDeposit(market.address, MAX_BN)
  //   await execute(tx, {
  //     onComplete: async () => await Promise.all([mutateLiquidityDepositBalance(market.address)]),
  //   })
  //   setIsApprovalLoading(false)
  // }, [account, market, execute, mutateLiquidityDepositBalance])

  // const handleClickDeposit = useCallback(async () => {
  //   if (!account || !market) {
  //     console.warn('Account does not exist')
  //     return null
  //   }
  //   setIsLoading(true)
  //   await execute(market.deposit(account.address, amount), {
  //     onComplete: async () =>
  //       await Promise.all([mutateLiquidityDepositBalance(market.address), mutateMyVaultLiquidity(market.address)]),
  //   })
  //   setIsLoading(false)
  // }, [account, amount, execute, market, mutateLiquidityDepositBalance, mutateMyVaultLiquidity])
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
            type="number"
            id="amount"
            onChange={(e) => console.log(e.target.value)}
            value={0}
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
        <div className="text-xs text-white">$0</div>
      </div>

      <div className="py-6 text-center text-xs text-white">
        Your deposit will be deployed in the Vault’s weekly strategy on Friday
        at 11am UTC
      </div>
      <div className="justify-stretch mt-6 flex flex-col">
        <Button
          label={'Deposit'}
          isLoading={false}
          variant={'action'}
          radius={'xs'}
          size={'full'}
          onClick={() => console.log('deposit')}
        />
      </div>
    </div>
  )
}
