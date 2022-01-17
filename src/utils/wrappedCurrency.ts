import { BaseCurrency, Currency, CurrencyAmount, Token, TokenAmount } from 'sdk'

export function wrappedCurrency(
  currency: Currency | undefined,
  chainId: number | undefined,
  wrappedToken: Token | undefined | null,
  baseCurrency: BaseCurrency | null
): Token | undefined {
  return chainId && currency === baseCurrency && wrappedToken
    ? wrappedToken
    : currency instanceof Token
    ? currency
    : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: number | undefined,
  wrappedToken: Token | undefined | null,
  baseCurrency: BaseCurrency | null
): TokenAmount | undefined {
  const token =
    currencyAmount && chainId
      ? wrappedCurrency(currencyAmount.currency, chainId, wrappedToken, baseCurrency)
      : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(
  token: Token,
  wrappedToken: Token,
  baseCurrency: BaseCurrency | null
): Currency | undefined {
  if (token.equals(wrappedToken)) {
    if (!baseCurrency) return

    return baseCurrency
  }

  return token
}
