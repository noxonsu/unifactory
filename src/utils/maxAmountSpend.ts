import { BaseCurrency, BaseCurrencyAmount, CurrencyAmount, JSBI } from 'sdk'
import { MIN_ETH } from '../constants'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(
  currencyAmount?: CurrencyAmount,
  baseCurrency?: BaseCurrency | null
): CurrencyAmount | undefined {
  if (!currencyAmount || !baseCurrency) return undefined

  if (currencyAmount.currency === baseCurrency) {
    if (JSBI.greaterThan(currencyAmount.raw, MIN_ETH)) {
      return new BaseCurrencyAmount(baseCurrency, JSBI.subtract(currencyAmount.raw, MIN_ETH))
    }

    return new BaseCurrencyAmount(baseCurrency, JSBI.BigInt(0))
  }

  return currencyAmount
}
