import TokenAbi from 'human-standard-token-abi'
import FactoryJson from '../contracts/build/Factory.json'
import RouterV2Json from '../contracts/build/RouterV2.json'
import Storage from '../contracts/build/Storage.json'
import { wrapperCurrencies } from '../constants'
import { cache, addValue } from './cache'
import { log } from './index'

const deployContract = async (params) => {
  const { abi, byteCode, library, onDeploy, deployArguments } = params

  let contract
  let accounts

  try {
    contract = new library.eth.Contract(abi)
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

    if (gas) {
      return await transaction
        .send({
          from: accounts[0],
          gas,
        })
        .on('transactionHash', (hash) => log(`deployment tx hash: ${hash}`))
        .on('error', (error) => console.error(error))
        .on('receipt', (receipt) => onDeploy(receipt))
    }
  } catch (error) {
    throw new Error(error)
  }
}

export const deployFactory = async (params) => {
  const { library, onDeploy, admin } = params
  const { abi, bytecode } = FactoryJson

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin],
    library,
    onDeploy,
  })
}

export const deployRouter = async (params) => {
  const { library, factory, onDeploy } = params
  const { abi, bytecode } = RouterV2Json
  const wrapperCurrency = wrapperCurrencies[library.chainId]

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [factory, wrapperCurrency],
    library,
    onDeploy,
  })
}

export const deployStorage = async (params) => {
  const { library, admin, onDeploy } = params
  const { abi, bytecode } = Storage

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin],
    library,
    onDeploy,
  })
}

export const getContractInstance = (library, address, abi) => {
  return new library.eth.Contract(abi, address)
}

export const deploySwapContracts = async (params) => {
  const { admin, library, onFactoryDeploy, onRouterDeploy } = params

  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const factoryInstance = await deployFactory({
    onDeploy: onFactoryDeploy,
    library,
    admin,
  })

  if (factoryInstance) {
    await deployRouter({
      onDeploy: onRouterDeploy,
      library,
      factory: factoryInstance.options.address,
    })
  } else {
    throw new Error('No factory contract')
  }
}

export const setFactoryOption = async (
  library,
  from,
  factoryAddress,
  method,
  value
) => {
  const factory = new library.eth.Contract(FactoryJson.abi, factoryAddress)

  return new Promise((resolve, reject) => {
    factory.methods[method](value)
      .send({
        from,
      })
      .then(resolve)
      .catch(reject)
  })
}

export const isValidAddressFormat = (address) => {
  return typeof address === 'string' && /^0x[A-Fa-f0-9]{40}$/.test(address)
}

export const isValidAddress = (library, address) => {
  if (!isValidAddressFormat(address) || !library) return false

  try {
    return library.utils.isAddress(address)
  } catch (error) {
    log(error.message)
    return false
  }
}

export const isContract = async (library, address) => {
  if (cache.isContract && cache.isContract[address]) {
    return cache.isContract[address]
  }

  if (!isValidAddressFormat(address)) return false

  const codeAtAddress = await library.eth.getCode(address)
  const codeIsEmpty =
    !codeAtAddress || codeAtAddress === '0x' || codeAtAddress === '0x0'

  if (!cache.isContract) cache.isContract = {}

  addValue('isContract', address, !codeIsEmpty)

  return !codeIsEmpty
}

export const returnTokenInfo = async (library, address) => {
  const result = await isContract(library, address)

  if (result) {
    if (cache.tokenInfo && cache.tokenInfo[address]) {
      return cache.tokenInfo[address]
    }

    const contract = new library.eth.Contract(TokenAbi, address)
    const name = await contract.methods.name().call()
    const symbol = await contract.methods.symbol().call()
    const decimals = await contract.methods.decimals().call()

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
