import { JSBI, Percent } from 'sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { injected, newWalletConnect, newWalletlink } from '../connectors'
import networks from 'networks.json'

export type NetworksId = keyof typeof networks

export const BSC_ID = 56
export const BSC_TESTNET_ID = 97
export const OPBNB_TESTNET_ID = 5611
export const OPBNB_MAINNET_ID = 204
export const POLYGON_TESTNET_ID = 80001
export const AVALANCHE_TESTNET_ID = 43113
export const POLIGON_ZKEVM_TESTNET_ID = 1442
export const GOERLI_ID = 5

export const STORAGE_NETWORK_ID = process.env.NODE_ENV === 'production' ? BSC_ID : GOERLI_ID
export const STORAGE_NETWORK_NAME = networks[STORAGE_NETWORK_ID.toString() as NetworksId].name
// @ts-ignore
export const STORAGE = networks[STORAGE_NETWORK_ID.toString() as NetworksId].storage
// through this key we get/set this app settings (we use the storage contract for many apps)
export const STORAGE_APP_KEY = 'definance'

export enum StorageMethod {
  getData = 'getData',
  allKeys = 'allKeys',
  allKeysData = 'allKeysData',
  setKeyData = 'setKeyData',
  setKeysData = 'setKeysData',
  clearKeyData = 'clearKeyData',
  clearKeysData = 'clearKeysData',
}

export enum FactoryMethod {
  allInfo = 'allInfo',
  setFeeTo = 'setFeeTo',
  setOnoutFeeTo = 'setOnoutFeeTo',
  setFeeToSetter = 'setFeeToSetter',
  setAllFeeToProtocol = 'setAllFeeToProtocol',
  setMainFees = 'setMainFees',
  setTotalFee = 'setTotalFee',
  setProtocolFee = 'setProtocolFee',
}

export const DOMAIN_REGEXP = /^([a-zA-Z0-9][a-zA-Z0-9-_]*\.)*[a-zA-Z0-9]*[a-zA-Z0-9-_]*[[a-zA-Z0-9]+$/

export const HEX_COLOR_REGEXP = /^#([\dA-F]{3}){1,2}$/i
export const RGB_COLOR_REGEXP = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
export const HSL_COLOR_REGEXP = /^hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/

export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

export const WALLET_NAMES = {
  INJECTED: 'Injected',
  METAMASK: 'MetaMask',
  WALLET_CONNECT: 'WalletConnect',
  WALLET_LINK: 'Coinbase Wallet',
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: WALLET_NAMES.INJECTED,
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: WALLET_NAMES.METAMASK,
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
  },
  WALLET_CONNECT: {
    connector: newWalletConnect(STORAGE_NETWORK_ID),
    name: WALLET_NAMES.WALLET_CONNECT,
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true,
  },
  WALLET_LINK: {
    connector: newWalletlink(STORAGE_NETWORK_ID),
    name: WALLET_NAMES.WALLET_LINK,
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
}

export const NetworkContextName = 'NETWORK'
// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20
// used for rewards deadlines
export const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)
export const BIG_INT_ZERO = JSBI.BigInt(0)
// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%
// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))
export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

export enum ERROR_CODE {
  rejectedTx = 4001,
}

export const THIRTY_SECONDS_IN_MS = 30_000
export const ONE_HOUR_IN_MS = 3_600_000
