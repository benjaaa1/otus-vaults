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
    <div className="py-8">
      <div>
        <label
          htmlFor="price"
          className="hidden text-sm font-medium text-gray-700"
        >
          Price
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="text"
            name="price"
            id="price"
            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="0.00"
            aria-describedby="price-currency"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm" id="price-currency">
              USD
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-between">
        <div>Wallet Balance</div>
        <div>0</div>
      </div>

      <div className="justify-stretch mt-6 flex flex-col">
        <button
          type="button"
          className="block  bg-teal-500 px-4 py-4 text-center text-sm font-medium text-gray-500 hover:text-gray-700 sm:rounded-lg"
        >
          Deposit
        </button>
      </div>
    </div>
  )
}
