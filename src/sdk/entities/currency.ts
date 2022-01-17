import JSBI from 'jsbi'
import { SolidityType } from '../constants'
import { validateSolidityTypeInstance } from '../utils'
import networks from 'networks.json'

/**
 * A currency is any fungible financial instrument on Ethereum, including Ether and all ERC20 tokens.
 *
 * The only instance of the base class `Currency` is Ether.
 */
export class Currency {
  public readonly decimals: number
  public readonly symbol?: string
  public readonly name?: string

  /**
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(decimals: number, symbol?: string, name?: string) {
    validateSolidityTypeInstance(JSBI.BigInt(decimals), SolidityType.uint8)

    this.decimals = decimals
    this.symbol = symbol
    this.name = name
  }
}

class BaseCurrency extends Currency {
  constructor() {
    const { decimals, name, symbol } = networks[1].baseCurrency

    super(decimals, symbol, name)
  }
}
/**
 * The only instance of the base class `Currency`.
 */
const ETHER = new BaseCurrency()

export { ETHER }
