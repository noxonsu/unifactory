import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { JSBI, Percent, Token, CurrencyAmount, Currency, BaseCurrency } from 'sdk'
import { TokenAddressMap } from 'state/lists/hooks'
import networks from 'networks.json'

export const getTimestamp = () => {
  return new Date(Math.floor(new Date().getTime() / 1000) * 1000).toISOString()
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

export function getExplorerLink(
  chainId: number,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  type Key = keyof typeof networks
  const url = networks[chainId.toString() as Key]?.explorer

  if (url) {
    switch (type) {
      case 'transaction': {
        return `${url}/tx/${data}`
      }
      case 'token': {
        return `${url}/token/${data}`
      }
      case 'block': {
        return `${url}/block/${data}`
      }
      case 'address':
      default: {
        return `${url}/address/${data}`
      }
    }
  }

  return ''
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

export function getRouterContract(address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, IUniswapV2Router02ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

type Asset = Currency | BaseCurrency | Token
type Argument = Asset | undefined | null

export function isAssetEqual(asset1: Argument, asset2: Argument) {
  if (!asset1 || !asset2) return false

  const keys1 = Object.keys(asset1)
  const keys2 = Object.keys(asset2)

  if (keys1.length !== keys2.length) return false

  for (let k of keys1) {
    //@ts-ignore
    if (asset1[k] !== asset2[k]) return false
  }

  return true
}

export function isTokenOnList(
  defaultTokens: TokenAddressMap,
  baseCurrency: BaseCurrency | null,
  currency?: Currency
): boolean {
  if (isAssetEqual(currency, baseCurrency)) return true

  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}
