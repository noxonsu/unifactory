import { Currency, ETHER, Token } from 'sdk'

export function currencyId(currency: Currency): typeof ETHER.name {
  if (currency === ETHER) return ETHER.name
  if (currency instanceof Token) return currency.address

  throw new Error('invalid currency')
}
