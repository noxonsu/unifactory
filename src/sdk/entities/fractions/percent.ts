import { Rounding, HUNDRED } from '../../constants'
import { Fraction } from './fraction'

const ONE_HUNDRED_PERCENT = new Fraction(HUNDRED)

export class Percent extends Fraction {
  public toSignificant(significantDigits: number = 5, format?: object, rounding?: Rounding): string {
    return this.multiply(ONE_HUNDRED_PERCENT).toSignificant(significantDigits, format, rounding)
  }

  public toFixed(decimalPlaces: number = 2, format?: object, rounding?: Rounding): string {
    return this.multiply(ONE_HUNDRED_PERCENT).toFixed(decimalPlaces, format, rounding)
  }
}
