import FactoryJson from '../contracts/build/Factory.json'
import RouterV2Json from '../contracts/build/RouterV2.json'
import Storage from '../contracts/build/ProjectStorage.json'
import { networks, wrapperCurrencies } from '../constants'

const log = (message) => {
  console.group('%c Log', 'color: crimson; font-size: 14px;')
  console.log(message)
  console.groupEnd()
}

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
        .on('transactionHash', (hash) => {
          log(`deployment tx hash: ${hash}`)
        })
        .on('error', (error) => {
          console.error(error)
        })
        .on('receipt', (receipt) => {
          onDeploy(receipt)
        })
    }
  } catch (error) {
    throw new Error(error)
  }
}

const deployFactory = async (params) => {
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

const deployRouter = async (params) => {
  const { library, factory, onDeploy } = params
  const { abi, bytecode } = RouterV2Json
  const chainId = await library.eth.getChainId()
  const wrapperCurrency = wrapperCurrencies[chainId]

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [factory, wrapperCurrency],
    library,
    onDeploy,
  })
}

const deployStorage = async (params) => {
  const { library, admin, onDeploy } = params
  const { abi, bytecode } = Storage
  const chainId = await library.eth.getChainId()
  const wrapperCurrency = wrapperCurrencies[chainId]

  return await deployContract({
    abi,
    byteCode: bytecode,
    deployArguments: [admin],
    library,
    onDeploy,
  })
}

// * temp contracts Polygon testnet *
const FACTORY = '0xe13ef32fD77a5B4112cc9d1D612CFbAFFaE99b34'
// hash must be change if we change a Pair contract, otherwise it's the same
const INIT_CODE_PAIR_HASH =
  '0x2b412748f39ea0fec33e51424ba001ecc89020b7b84f9827e1bd91468446d718'
const ROUTER = '0x2f9CfEB4E7a3DFf011569d242a34a79AA222E3C9'

// BSC testnet
const STORAGE = '0xa159A55cDAB9ac1C0b08047bEe6c70730CC2f7EF'

const getContractInstance = (library, address, abi) => {
  return new library.eth.Contract(abi, address)
}

export const deploy = async (params) => {
  const { admin, feeRecipient, library, onFactoryDeploy, onRouterDeploy } =
    params

  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const factoryInstance = await deployFactory({
    onDeploy: onFactoryDeploy,
    library,
    admin: accounts[0],
  })

  if (factoryInstance) {
    log(`factory address: ${factoryInstance.options.address}`)

    const initCodeHash = await factoryInstance.methods
      .INIT_CODE_PAIR_HASH()
      .call()

    log(`init code hash: ${initCodeHash}`)

    await factoryInstance.methods
      .setFeeTo(feeRecipient)
      .send({
        from: accounts[0],
      })
      .catch((error) => {
        console.error('setFeeTo: ', error)
      })

    await factoryInstance.methods
      .setFeeToSetter(admin)
      .send({
        from: accounts[0],
      })
      .catch((error) => {
        console.error('setFeeToSetter: ', error)
      })

    const routerInstance = await deployRouter({
      onDeploy: onRouterDeploy,
      library,
      factory: factoryInstance.options.address,
    })

    log(`router address: ${routerInstance.options.address}`)
  } else {
    throw new Error('No factory contract')
  }
}
