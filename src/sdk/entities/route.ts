import invariant from 'tiny-invariant'
import { Currency, BaseCurrency } from './currency'
import { Token } from './token'
import { Pair } from './pair'
import { Price } from './fractions/price'
export class Route {
  public readonly pairs: Pair[]
  public readonly path: Token[]
  public readonly input: Currency
  public readonly output: Currency
  public readonly midPrice: Price

  public constructor(params: {
    pairs: Pair[]
    input: Currency
    output?: Currency
    baseCurrency: BaseCurrency
    wrappedToken: Token
  }) {
    const { pairs, input, baseCurrency, output, wrappedToken } = params

    invariant(pairs.length > 0, 'PAIRS')
    invariant(
      pairs.every((pair) => pair.chainId === pairs[0].chainId),
      'CHAIN_IDS'
    )
    invariant(
      (input instanceof Token && pairs[0].involvesToken(input)) ||
        (input === baseCurrency && pairs[0].involvesToken(wrappedToken)),
      'INPUT'
    )
    invariant(
      typeof output === 'undefined' ||
        (output instanceof Token && pairs[pairs.length - 1].involvesToken(output)) ||
        (output === baseCurrency && pairs[pairs.length - 1].involvesToken(wrappedToken)),
      'OUTPUT'
    )

    const path: Token[] = [input instanceof Token ? input : wrappedToken]
    for (const [i, pair] of pairs.entries()) {
      const currentInput = path[i]
      invariant(currentInput.equals(pair.token0) || currentInput.equals(pair.token1), 'PATH')
      const output = currentInput.equals(pair.token0) ? pair.token1 : pair.token0
      path.push(output)
    }

    this.pairs = pairs
    this.path = path
    this.midPrice = Price.fromRoute(this)
    this.input = input
    this.output = output ?? path[path.length - 1]
  }

  public get chainId(): number {
    return this.pairs[0].chainId
  }
}
