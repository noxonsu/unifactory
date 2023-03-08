import { BSC_ID } from './'

export const originUrl = 'https://noxon.wpmix.net'
export const onoutFeeAdmin = '0x6D1EB33c063CBe69d064EE22537dBF107e8816f6'
export const onoutFeeAddress = '0xDf50EF7E506536354e7a805442dcBF25c7Ac249B'

export enum Addition {
  switchCopyright = 1,
  premiumVersion = 2,
}

export interface PaidAddition {
  id: Addition
  cryptoCost?: number
  usdCost?: number
  networkIds: number[]
}

export const paidAdditions: {
  [name: string]: PaidAddition
} = {
  switchCopyright: {
    id: Addition.switchCopyright,
    cryptoCost: 0.1,
    networkIds: [BSC_ID],
  },
  premiumVersion: {
    id: Addition.premiumVersion,
    usdCost: 1_000,
    networkIds: [BSC_ID],
  },
}
