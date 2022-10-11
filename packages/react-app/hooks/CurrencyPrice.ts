import useSynthetixQueries from '@synthetixio/queries'
import { ZERO_BN } from '../constants/bn'
import { CurrencyKey } from '../constants/currency'
import { toBN } from '../utils/formatters/numbers'

export const useCurrencyPrice = (currencyKey: CurrencyKey) => {
  const { useExchangeRatesQuery } = useSynthetixQueries()
  const exchangeRatesQuery = useExchangeRatesQuery()
  console.log({ exchangeRatesQuery })

  const exchangeRates = exchangeRatesQuery.isSuccess
    ? exchangeRatesQuery.data ?? null
    : null

  console.log({ exchangeRates })
  // const selectPriceCurrencyRate = exchangeRates && exchangeRates[currencyKey]
  // const currencyUSDPrice = exchangeRates && exchangeRates[currencyKey]
  // return !(currencyUSDPrice && selectPriceCurrencyRate)
  //   ? ZERO_BN
  //   : toBN(currencyUSDPrice).div(selectPriceCurrencyRate)
}
