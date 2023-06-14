import { POLYGON_TESTNET_ID, BSC_ID } from './'

export const onoutUrl = 'https://onout.org'
export const originUrl = 'https://noxon.wpmix.net'
export const onoutFeeAddress = '0xDf50EF7E506536354e7a805442dcBF25c7Ac249B'

export const requiredPaymentNetworkId = process.env.NODE_ENV === 'production' ? BSC_ID : POLYGON_TESTNET_ID

export enum Addition {
  switchCopyright = 1,
  premiumVersion = 2,
}

export interface PaidAddition {
  id: Addition
  usdCost: number
}

export type AdditionName = 'switchCopyright' | 'premiumVersion'

export const paidAdditions: {
  [name in AdditionName]: PaidAddition
} = {
  switchCopyright: {
    id: Addition.switchCopyright,
    usdCost: 30,
  },
  premiumVersion: {
    id: Addition.premiumVersion,
    usdCost: 1_000,
  },
}
