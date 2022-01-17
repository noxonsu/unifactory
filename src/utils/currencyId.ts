import { BaseCurrency, Currency, Token } from 'sdk'

export function currencyId(currency: Currency, baseCurrency: BaseCurrency | null): string {
  if (currency === baseCurrency) return baseCurrency.name || ''
  if (currency instanceof Token) return currency.address

  throw new Error('invalid currency')
}
