import { Currency, CurrencyAmount, ETHER, Token, TokenAmount } from 'sdk'

export function wrappedCurrency(
  currency: Currency | undefined,
  chainId: number | undefined,
  wrappedToken: Token | undefined | null
): Token | undefined {
  return chainId && currency === ETHER && wrappedToken ? wrappedToken : currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: number | undefined,
  wrappedToken: Token | undefined | null
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId, wrappedToken) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token, wrappedToken: Token): Currency {
  if (token.equals(wrappedToken)) return ETHER

  return token
}
