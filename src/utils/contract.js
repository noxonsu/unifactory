import FactoryJson from '../contracts/build/Factory.json'
import RouterV2Json from '../contracts/build/RouterV2.json'
import { networks, wrapperCurrencies } from '../constants'

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
          console.log('transaction hash:', hash)
        })
        .on('error', (error) => {
          console.error('transaction error:', error)
        })
        .on('receipt', (receipt) => {
          console.log('transaction receipt:', receipt)
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

// * temp contracts Polygon testnet *
const FACTORY = '0xe13ef32fD77a5B4112cc9d1D612CFbAFFaE99b34'
// hash must be change if we change a Pair contract, otherwise it's the same
const INIT_CODE_PAIR_HASH =
  '0x2b412748f39ea0fec33e51424ba001ecc89020b7b84f9827e1bd91468446d718'
const ROUTER = '0x2f9CfEB4E7a3DFf011569d242a34a79AA222E3C9'

const getFactory = (address, library) =>
  new library.eth.Contract(FactoryJson.abi, address)

export const deploy = async (params) => {
  const { admin, feeRecipient, library, onFactoryDeploy, onRouterDeploy } =
    params

  // await factorySetup({
  //   factoryAddress: FACTORY,
  //   feeRecipient,
  //   admin,
  //   library,
  // })

  // return

  const accounts = await window.ethereum.request({ method: 'eth_accounts' })

  const factoryInstance = await deployFactory({
    onDeploy: onFactoryDeploy,
    library,
    admin: accounts[0],
  })

  console.log('factory Instance: ', factoryInstance)

  if (factoryInstance) {
    const initCodeHash = await factoryInstance.methods
      .INIT_CODE_PAIR_HASH()
      .call()

    console.log('initCodeHash: ', initCodeHash)

    // await factoryInstance.methods
    //   .setFeeTo(feeRecipient)
    //   .call()
    //   .then((result) => {
    //     console.log('setFeeTo result: ', result);
    //   })
    //   .catch((error) => {
    //     console.error('setFeeTo: ', error);
    //   });

    // await factoryInstance.methods
    //   .setFeeToSetter(admin)
    //   .call()
    //   .then((result) => {
    //     console.log('setFeeToSetter result: ', result);
    //   })
    //   .catch((error) => {
    //     console.error('setFeeToSetter: ', error);
    //   });

    const routerInstance = await deployRouter({
      onDeploy: onRouterDeploy,
      library,
      factory: factoryInstance.options.address,
    })

    console.log('router Instance: ', routerInstance)
  } else {
    throw new Error('No factory contract')
  }
}

const factorySetup = async (params) => {
  const { factoryAddress, feeRecipient, admin, library } = params

  const factory = getFactory(factoryAddress, library)
  const feeTo = await factory.methods.feeTo().call()
  const feeToSetter = await factory.methods.feeToSetter().call()
  const allPairsLength = await factory.methods.allPairsLength().call()

  console.log('feeTo: ', feeTo)
  console.log('feeToSetter: ', feeToSetter)
  console.log('allPairsLength: ', allPairsLength)

  // Polygon testnet
  const tokenA = '0xb923b52b60e247e34f9afe6b3fa5accbaea829e8'
  const tokenB = '0x06e72f187c68764d9969752cc27e503c75bd3657'

  await factory.methods
    .createPair(tokenA, tokenB)
    .call()
    .then((result) => console.log('createPair result: ', result))
    .catch((error) => console.error('createPair: ', error))

  await factory.methods
    .setFeeTo(feeRecipient)
    // with this call we have a error: Factory: FORBIDDEN
    .call()
    // with this we have an empty object as a result
    // .call({
    //   from: accounts[0],
    // })
    .then((result) => {
      console.log('setFeeTo result: ', result)
    })
    .catch((error) => {
      console.error('setFeeTo: ', error)
    })

  await factory.methods
    .setFeeToSetter(admin)
    .call()
    .then((result) => {
      console.log('setFeeToSetter result: ', result)
    })
    .catch((error) => {
      console.error('setFeeToSetter: ', error)
    })
}
