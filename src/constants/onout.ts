import { BSC_TESTNET_ID, BSC_ID } from './'

export const originUrl = 'https://noxon.wpmix.net'
export const onoutFeeAdmin = '0x6D1EB33c063CBe69d064EE22537dBF107e8816f6'
export const onoutFeeAddress = '0xDf50EF7E506536354e7a805442dcBF25c7Ac249B'

export const requiredPaymentNetworkId = process.env.NODE_ENV === 'production' ? BSC_ID : BSC_TESTNET_ID

export enum Addition {
  switchCopyright = 1,
  premiumVersion = 2,
}

export interface PaidAddition {
  id: Addition
  cryptoCost?: number
  usdCost?: number
}

export const paidAdditions: {
  [name: string]: PaidAddition
} = {
  switchCopyright: {
    id: Addition.switchCopyright,
    // cryptoCost: 0.1,
    usdCost: 30,
  },
  premiumVersion: {
    id: Addition.premiumVersion,
    usdCost: 1_000,
  },
}
