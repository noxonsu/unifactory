import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from 'web3-utils'
import TokenAbi from 'human-standard-token-abi'
import Registry from 'contracts/build/Registry.json'
import Factory from 'contracts/build/Factory.json'
import RouterV2 from 'contracts/build/RouterV2.json'
import Storage from 'contracts/build/Storage.json'
import { cache, addValue } from './cache'
import { getWeb3Library } from './getLibrary'
import { log } from './index'

const deployContract = async (params: any) => {
  const { abi, byteCode, library, onDeploy, deployArguments } = params

  let contract
  let accounts

  try {
    const web3 = getWeb3Library(library.provider)

    contract = new web3.eth.Contract(abi)
    //@ts-ignore
    accounts = await window.ethereum.request({ method: 'eth_accounts' })
  } catch (error) {
    throw new Error(error)
  }

  const transaction = contract.deploy({
    data: byteCode,
    arguments: deployArguments,
  })

  try {
    const gas = await transaction.estimateGas({ from: accounts[0] })

    return await transaction
      .send({
        from: accounts[0],
        gas,
      })
      .on('transactionHash', (hash: string) => log(`deployment tx hash: ${hash}`))
      .on('error', (error: any) => console.error(error))
      .on('receipt', (receipt: any) => onDeploy(receipt))
  } catch (error) {
    throw new Error(error)
  }
}

export const deployFactory = async (params: any) => {
  const { library, onDeploy, admin } = params
  const { abi, bytecode } = Factory

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin],
    library,
    onDeploy,
  })
}

export const deployRouter = async (params: any) => {
  const { library, factory, onDeploy, wrappedToken } = params
  const { abi, bytecode } = RouterV2

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [factory, wrappedToken],
    library,
    onDeploy,
  })
}

export const deployStorage = async (params: any) => {
  const { library, admin, onDeploy, registryAddress, domain } = params
  const { abi, bytecode } = Storage

  try {
    const storage = await deployContract({
      abi,
      byteCode: bytecode,
      deployArguments: [admin],
      library,
      onDeploy,
    })
    //@ts-ignore
    const accounts = await window?.ethereum?.request({ method: 'eth_accounts' })
    const registry: any = getContractInstance(library, registryAddress, Registry.abi)

    await registry.methods.addDomainStorage(domain, storage.options.address).send({
      from: accounts[0],
    })
  } catch (error) {
    throw new Error(error)
  }
}

export const getContractInstance = (library: Web3Provider, address: string, abi: any) => {
  const web3 = getWeb3Library(library.provider)

  return new web3.eth.Contract(abi, address)
}

export const deploySwapContracts = async (params: any) => {
  const { domain, registryAddress, admin, library, wrappedToken, onFactoryDeploy, onRouterDeploy } = params

  try {
    const factory = await deployFactory({
      onDeploy: onFactoryDeploy,
      library,
      admin,
    })

    if (factory) {
      const router = await deployRouter({
        onDeploy: onRouterDeploy,
        library,
        factory: factory.options.address,
        wrappedToken,
      })
      //@ts-ignore
      const accounts = await window?.ethereum?.request({ method: 'eth_accounts' })
      const registry: any = getContractInstance(library, registryAddress, Registry.abi)

      await registry.methods
        .addDomainData(domain, {
          admin,
          factory: factory.options.address,
          router: router.options.address,
        })
        .send({
          from: accounts[0],
        })
    } else {
      throw new Error('No factory contract')
    }
  } catch (error) {
    throw new Error(error)
  }
}

export const getFactoryOptions = async (library: Web3Provider, factoryAddress: string) => {
  const factory = getContractInstance(library, factoryAddress, Factory.abi)

  return new Promise(async (resolve, reject) => {
    try {
      const options = await factory.methods.allInfo().call()

      resolve(options)
    } catch (error) {
      reject(error)
    }
  })
}

export const setFactoryOption = async (
  library: Web3Provider,
  from: string,
  factoryAddress: string,
  method: string,
  value: any
) => {
  const factory = getContractInstance(library, factoryAddress, Factory.abi)

  return new Promise((resolve, reject) => {
    factory.methods[method](value)
      .send({
        from,
      })
      .then(resolve)
      .catch(reject)
  })
}

export const isValidAddressFormat = (address: string) => {
  return typeof address === 'string' && /^0x[A-Fa-f0-9]{40}$/.test(address)
}

export const isValidAddress = (library: Web3Provider, address: string) => {
  if (!isValidAddressFormat(address) || !library) return false

  try {
    return isAddress(address)
  } catch (error) {
    log(error.message)
    return false
  }
}

export const isContract = async (library: Web3Provider, address: string) => {
  if (cache.isContract && cache.isContract[address]) {
    return cache.isContract[address]
  }

  if (!isValidAddressFormat(address)) return false

  const codeAtAddress = await library.getCode(address)
  const codeIsEmpty = !codeAtAddress || codeAtAddress === '0x' || codeAtAddress === '0x0'

  if (!cache.isContract) cache.isContract = {}

  addValue('isContract', address, !codeIsEmpty)

  return !codeIsEmpty
}

export const returnTokenInfo = async (library: Web3Provider, address: string) => {
  const result = await isContract(library, address)

  if (result) {
    if (cache.tokenInfo && cache.tokenInfo[address]) {
      return cache.tokenInfo[address]
    }

    const contract = new Contract(address, TokenAbi, library)
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
