import { BaseCurrency, Currency, Token } from 'sdk'
import { isAssetEqual } from '.'

export function currencyId(currency: Currency, baseCurrency: BaseCurrency | null): string {
  if (!baseCurrency) return ''
  if (isAssetEqual(currency, baseCurrency)) return baseCurrency.name || ''
  if (currency instanceof Token) return currency.address

  throw new Error('invalid currency')
}
