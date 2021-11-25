export const networks = {
  1: {
    name: 'Ethereum',
    rpc: 'https://mainnet.infura.io/v3/212957e8adf14bf8aecf82358083e63e',
    chainId: 1,
  },
  56: {
    name: 'Binance Smart Chain',
    rpc: 'https://bsc-dataseed1.ninicoin.io',
    chainId: 56,
  },
  137: {
    name: 'Polygon',
    rpc: 'https://rpc-mainnet.matic.network',
    chainId: 137,
  },
  3: {
    name: 'Ropsten',
    rpc: 'https://ropsten.infura.io/v3/212957e8adf14bf8aecf82358083e63e',
    chainId: 3,
  },
  4: {
    name: 'Rinkeby',
    rpc: 'https://rinkeby.infura.io/v3/212957e8adf14bf8aecf82358083e63e',
    chainId: 4,
  },
  97: {
    name: 'BSC Testnet',
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chainId: 97,
  },
  80001: {
    name: 'Polygon testnet',
    rpc: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
  },
}

export const supportedChainIds = [
  networks[1].chainId,
  networks[56].chainId,
  networks[137].chainId,
  networks[3].chainId,
  networks[4].chainId,
  networks[97].chainId,
  networks[80001].chainId,
]

export const wrapperCurrencies = {
  1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  56: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  137: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  3: '0xc778417e063141139fce010982780140aa0cd5ab',
  4: '0xc778417e063141139fce010982780140aa0cd5ab',
  97: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
  80001: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
}

export const pinataGateway = 'https://gateway.pinata.cloud'
export const pinataApi = 'https://api.pinata.cloud'
export const pinataEndpoints = {
  generateApiKeys: `${pinataApi}/users/generateApiKey`,
  ipfs: `${pinataGateway}/ipfs`,
  pinJSONToIPFS: `${pinataApi}/pinning/pinJSONToIPFS`,
  pinList: `${pinataApi}/data/pinList`,
}

export const MAIN_FILE_NAME = 'swapProject.json'

export const projectOptions = {
  NAME: 'NAME',
  LOGO: 'LOGO',
  COLOR: 'COLOR',
  TOKENS: 'TOKENS',
}
