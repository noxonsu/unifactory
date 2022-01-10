import { BLOCKED_PRICE_IMPACT_NON_EXPERT } from '../constants'
import { CurrencyAmount, Fraction, JSBI, Percent, TokenAmount, Trade } from 'sdk'
import { ALLOWED_PRICE_IMPACT_HIGH, ALLOWED_PRICE_IMPACT_LOW, ALLOWED_PRICE_IMPACT_MEDIUM } from '../constants'
import { Field } from 'state/swap/actions'
import { basisPointsToPercent } from './index'

// computes price breakdown for the trade
export function computeTradePriceBreakdown(trade?: Trade | null): {
  priceImpactWithoutFee: Percent | undefined
  realizedLPFee: CurrencyAmount | undefined | null
} {
  const BASE_FEE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000))
  const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))
  const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE)

  // console.group('%c fees constants', 'color: orange; font-size: 14px')
  // console.log('BASE_FEE: ', BASE_FEE.toSignificant(8))
  // console.log('ONE_HUNDRED_PERCENT: ', ONE_HUNDRED_PERCENT.toSignificant(8))
  // console.log('INPUT_FRACTION_AFTER_FEE: ', INPUT_FRACTION_AFTER_FEE.toSignificant(8))
  // console.groupEnd()
  // for each hop in our trade, take away the x*y=k price impact from base fee
  // e.g. Case with 0.3% fee for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  const realizedLPFee = !trade
    ? undefined
    : ONE_HUNDRED_PERCENT.subtract(
        trade.route.pairs.reduce<Fraction>((currentFee: Fraction): Fraction => {
          // console.group('%c Log', 'color: orange; font-size: 14px')
          // console.log('currentFee: ', currentFee.toSignificant(8))
          // console.groupEnd()
          return currentFee.multiply(INPUT_FRACTION_AFTER_FEE)
        }, ONE_HUNDRED_PERCENT)
      )

  // remove lp fees from price impact
  const priceImpactWithoutFeeFraction = trade && realizedLPFee ? trade.priceImpact.subtract(realizedLPFee) : undefined

  // the x*y=k impact
  const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
    ? new Percent(priceImpactWithoutFeeFraction?.numerator, priceImpactWithoutFeeFraction?.denominator)
    : undefined

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount =
    realizedLPFee &&
    trade &&
    (trade.inputAmount instanceof TokenAmount
      ? new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)
      : CurrencyAmount.ether(realizedLPFee.multiply(trade.inputAmount.raw).quotient))

  // if (trade) {
  //   console.group('%c computeTradePriceBreakdown', 'color: green; font-size: 14px')
  //   console.log('trade: ', trade)
  //   console.log('realizedLPFee: ', realizedLPFee?.toSignificant(8))
  //   console.log('priceImpactWithoutFeeFraction: ', priceImpactWithoutFeeFraction?.toSignificant(8))
  //   console.log('priceImpactWithoutFeePercent: ', priceImpactWithoutFeePercent?.toSignificant(8))
  //   console.log('realizedLPFeeAmount: ', realizedLPFeeAmount?.toSignificant(8))
  //   console.groupEnd()
  // }

  return { priceImpactWithoutFee: priceImpactWithoutFeePercent, realizedLPFee: realizedLPFeeAmount }
}

// computes the minimum amount out and maximum amount in for a trade given a user specified allowed slippage in bips
export function computeSlippageAdjustedAmounts(
  trade: Trade | undefined,
  allowedSlippage: number
): { [field in Field]?: CurrencyAmount } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  }
}

export function warningSeverity(priceImpact: Percent | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!priceImpact?.lessThan(BLOCKED_PRICE_IMPACT_NON_EXPERT)) return 4
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) return 3
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 2
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_LOW)) return 1
  return 0
}

export function formatExecutionPrice(trade?: Trade, inverted?: boolean): string {
  if (!trade) {
    return ''
  }
  return inverted
    ? `${trade.executionPrice.invert().toSignificant(6)} ${trade.inputAmount.currency.symbol} / ${
        trade.outputAmount.currency.symbol
      }`
    : `${trade.executionPrice.toSignificant(6)} ${trade.outputAmount.currency.symbol} / ${
        trade.inputAmount.currency.symbol
      }`
}
