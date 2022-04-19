import { HEX_COLOR_REGEXP, RGB_COLOR_REGEXP, HSL_COLOR_REGEXP } from '../constants'

export const isValidColor = (color: string) =>
  !!color && Boolean(color.match(HEX_COLOR_REGEXP) || color.match(RGB_COLOR_REGEXP) || color.match(HSL_COLOR_REGEXP))
