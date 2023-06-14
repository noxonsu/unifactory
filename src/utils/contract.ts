import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from 'web3-utils'
import { ethers } from 'ethers'
import TokenAbi from 'human-standard-token-abi'
import Factory from 'contracts/build/Factory.json'
import RouterV2 from 'contracts/build/RouterV2.json'
import { ONE_HOUR_IN_MS } from '../constants'
import cache from './cache'
import { getWeb3Library } from './getLibrary'
import networks from 'networks.json'

const noop = () => {}

export const getContractInstance = (provider: any, address: string, abi: any) => {
  const web3 = getWeb3Library(provider)

  return new web3.eth.Contract(abi, address)
}

const deployContract = async (params: {
  abi: any
  byteCode: string
  library: Web3Provider
  onDeploy?: (v: unknown) => void
  onHash?: (h: string) => void
  deployArguments: unknown[]
}) => {
  const { abi, byteCode, library, onDeploy = noop, onHash = noop, deployArguments } = params

  let contract
  let accounts

  try {
    const web3 = getWeb3Library(library.provider)

    contract = new web3.eth.Contract(abi)
    //@ts-ignore
    accounts = await window.ethereum.request({ method: 'eth_accounts' })

    const transaction = contract.deploy({
      data: byteCode,
      arguments: deployArguments,
    })

    const gasLimit = await transaction.estimateGas({ from: accounts[0] })
    const gasPrice = await web3.eth.getGasPrice()

    return await transaction
      .send({
        from: accounts[0],
        gas: gasLimit,
        gasPrice,
      })
      .on('transactionHash', (hash: string) => onHash(hash))
      .on('receipt', (receipt: any) => onDeploy(receipt))
      .on('error', (error: any) => console.error(error))
  } catch (error) {
    throw error
  }
}

export const deployFactory = async (params: {
  library: Web3Provider
  onHash?: (h: string) => void
  admin: string
  originFeeAddress: string
}) => {
  const { library, onHash, admin, originFeeAddress } = params
  const { abi, bytecode } = Factory

  return deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin, originFeeAddress],
    library,
    onHash,
  })
}

export const deployRouter = async (params: {
  library: Web3Provider
  factory: string
  onHash?: (h: string) => void
  wrappedToken: string
}) => {
  const { library, factory, onHash, wrappedToken } = params
  const { abi, bytecode } = RouterV2

  return deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [factory, wrappedToken],
    library,
    onHash,
  })
}

export const deploySwapContracts = async (params: {
  admin: string
  chainId: number
  library: Web3Provider
  wrappedToken: string
  originFeeAddress: string
  onFactoryHash?: (hash: string) => void
  onRouterHash?: (hash: string) => void
  onSuccessfulDeploy?: (params: { chainId: number; factory: string; router: string }) => void
  hasFactory?: string | boolean
}) => {
  const {
    admin,
    chainId,
    library,
    wrappedToken,
    originFeeAddress,
    onFactoryHash,
    onRouterHash,
    onSuccessfulDeploy,
    hasFactory,
  } = params

  try {
    let factoryAddress = null

    if (!hasFactory) {
      const factory = await deployFactory({
        onHash: onFactoryHash,
        library,
        admin,
        originFeeAddress,
      })

      if (factory) factoryAddress = factory.options.address
    } else {
      factoryAddress = hasFactory
    }

    if (factoryAddress) {
      const router = await deployRouter({
        onHash: onRouterHash,
        library,
        // @ts-ignore
        factory: factoryAddress,
        wrappedToken,
      })

      if (typeof onSuccessfulDeploy === 'function') {
        onSuccessfulDeploy({
          chainId,
          // @ts-ignore
          factory: factoryAddress,
          router: router.options.address,
        })
      }
    } else {
      throw new Error('No factory contract')
    }
  } catch (error) {
    throw error
  }
}

export const setFactoryOption = async (params: {
  library: Web3Provider
  from: string
  factoryAddress: string
  method: string
  values: unknown[]
  onHash?: (hash: string) => void
  onReceipt?: (receipt: object, success: boolean) => void
}) => {
  const { library, from, factoryAddress, method, values, onHash, onReceipt } = params
  const factory = getContractInstance(library.provider, factoryAddress, Factory.abi)

  return new Promise((resolve, reject) => {
    factory.methods[method](...values)
      .send({
        from,
      })
      .on('transactionHash', (hash: string) => {
        if (typeof onHash === 'function') onHash(hash)
      })
      .on('receipt', (receipt: any) => {
        if (typeof onReceipt === 'function') onReceipt(receipt, receipt?.status)
      })
      .then(resolve)
      .catch(reject)
  })
}

export const isValidAddressFormat = (address: string) => {
  return typeof address === 'string' && /^0x[A-Fa-f0-9]{40}$/.test(address)
}

export const isValidAddress = (address: string) => {
  if (!isValidAddressFormat(address)) return false

  try {
    return isAddress(address)
  } catch (error) {
    console.error(error)
    return false
  }
}

export const isContract = async (provider: any, address: string) => {
  const contractItem = cache.get('isContract', address)
  const now = Date.now()

  if (contractItem?.value && contractItem?.deadline && contractItem.deadline > now) {
    return contractItem?.value
  }

  if (!isValidAddressFormat(address)) return false

  const codeAtAddress = await provider.getCode(address)
  const codeIsEmpty = !codeAtAddress || codeAtAddress === '0x' || codeAtAddress === '0x0'

  cache.add({
    area: 'isContract',
    key: address,
    value: !codeIsEmpty,
    deadline: now + ONE_HOUR_IN_MS,
  })

  return !codeIsEmpty
}

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
}

export const returnTokenInfo = async (chainId: string, address: string) => {
  type ChainId = keyof typeof networks

  if (!networks[chainId as ChainId]?.rpc) return

  const provider = new ethers.providers.JsonRpcProvider(networks[chainId as ChainId].rpc)
  const result = await isContract(provider, address)

  if (result) {
    const tokenItem = cache.get<TokenInfo>('tokenInfo', address)

    if (tokenItem?.value) return tokenItem.value

    //@ts-ignore
    const contract = new Contract(address, TokenAbi, provider)
    const name = await contract.name()
    const symbol = await contract.symbol()
    const decimals = await contract.decimals()

    cache.add<TokenInfo>({
      area: 'tokenInfo',
      key: address,
      value: {
        name,
        symbol,
        decimals,
      },
    })

    return {
      name,
      symbol,
      decimals,
    }
  }

  return false
}
