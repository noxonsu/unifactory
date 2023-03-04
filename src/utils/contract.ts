import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from 'web3-utils'
import { ethers } from 'ethers'
import TokenAbi from 'human-standard-token-abi'
import Factory from 'contracts/build/Factory.json'
import RouterV2 from 'contracts/build/RouterV2.json'
import { cache, addValue } from './cache'
import { getWeb3Library } from './getLibrary'
import networks from 'networks.json'

export const getContractInstance = (provider: any, address: string, abi: any) => {
  const web3 = getWeb3Library(provider)

  return new web3.eth.Contract(abi, address)
}

const deployContract = async (params: any) => {
  const { abi, byteCode, library, onDeploy = () => {}, onHash = () => {}, deployArguments } = params

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

export const deployFactory = async (params: any) => {
  const { library, onHash, admin, originFeeAdmin, originFeeAddress } = params
  const { abi, bytecode } = Factory

  return deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin, originFeeAdmin, originFeeAddress],
    library,
    onHash,
  })
}

export const deployRouter = async (params: any) => {
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
  originFeeAdmin: string
  originFeeAddress: string
  onFactoryHash?: (hash: string) => void
  onRouterHash?: (hash: string) => void
  onSuccessfulDeploy?: (params: { chainId: number; factory: string; router: string }) => void
}) => {
  const {
    admin,
    chainId,
    library,
    wrappedToken,
    originFeeAdmin,
    originFeeAddress,
    onFactoryHash,
    onRouterHash,
    onSuccessfulDeploy,
  } = params

  try {
    const factory = await deployFactory({
      onHash: onFactoryHash,
      library,
      admin,
      originFeeAdmin,
      originFeeAddress,
    })

    if (factory) {
      const router = await deployRouter({
        onHash: onRouterHash,
        library,
        factory: factory.options.address,
        wrappedToken,
      })

      if (typeof onSuccessfulDeploy === 'function') {
        onSuccessfulDeploy({
          chainId,
          factory: factory.options.address,
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
  values: any[]
  onHash?: (hash: string) => void
}) => {
  const { library, from, factoryAddress, method, values, onHash } = params
  const factory = getContractInstance(library.provider, factoryAddress, Factory.abi)

  return new Promise((resolve, reject) => {
    factory.methods[method](...values)
      .send({
        from,
      })
      .on('transactionHash', (hash: string) => {
        if (typeof onHash === 'function') onHash(hash)
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
  if (cache.isContract && cache.isContract[address]) {
    return cache.isContract[address]
  }

  if (!isValidAddressFormat(address)) return false

  const codeAtAddress = await provider.getCode(address)
  const codeIsEmpty = !codeAtAddress || codeAtAddress === '0x' || codeAtAddress === '0x0'

  if (!cache.isContract) cache.isContract = {}

  addValue('isContract', address, !codeIsEmpty)

  return !codeIsEmpty
}

export const returnTokenInfo = async (chainId: string, address: string) => {
  type ChainId = keyof typeof networks

  if (!networks[chainId as ChainId]?.rpc) return

  const provider = new ethers.providers.JsonRpcProvider(networks[chainId as ChainId].rpc)
  const result = await isContract(provider, address)

  if (result) {
    if (cache.tokenInfo && cache.tokenInfo[address]) {
      return cache.tokenInfo[address]
    }
    //@ts-ignore
    const contract = new Contract(address, TokenAbi, provider)
    const name = await contract.name()
    const symbol = await contract.symbol()
    const decimals = await contract.decimals()

    addValue('tokenInfo', address, {
      name,
      symbol,
      decimals,
    })

    return {
      name,
      symbol,
      decimals,
    }
  }

  return false
}
