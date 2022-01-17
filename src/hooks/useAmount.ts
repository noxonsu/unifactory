import { useMemo } from 'react'
import { BaseCurrencyAmount } from 'sdk'
import { BigintIsh } from 'sdk/constants'
import { useBaseCurrency } from 'hooks/useCurrency'

export function useBaseCurrencyAmount(amount: BigintIsh): BaseCurrencyAmount | null {
  const baseCurrency = useBaseCurrency()

  return useMemo(() => {
    if (!baseCurrency) return null

    try {
      return new BaseCurrencyAmount(baseCurrency, amount)
    } catch (error) {
      console.error('Failed to use Base currency amount: ', error)
      return null
    }
  }, [baseCurrency, amount])
}
