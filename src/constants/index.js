// import networks from '../networks.json'

// const supportedChainIds = Object.values(networks)
//   .filter((network) => network.wrappedToken !== '')
//   .map((network) => network.chainId)

const pinataGateway = 'https://gateway.pinata.cloud'
const pinataApi = 'https://api.pinata.cloud'
const pinataEndpoints = {
  generateApiKeys: `${pinataApi}/users/generateApiKey`,
  ipfs: `${pinataGateway}/ipfs`,
  pinJSONToIPFS: `${pinataApi}/pinning/pinJSONToIPFS`,
  pinList: `${pinataApi}/data/pinList`,
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const storageMethods = {
  setDomain: 'setDomain',
  setProjectName: 'setProjectName',
  setLogoUrl: 'setLogoUrl',
  setBrandColor: 'setBrandColor',
  addTokenList: 'addTokenList',
  updateTokenList: 'updateTokenList',
  removeTokenList: 'removeTokenList',
  clearTokenLists: 'clearTokenLists',
  setFullData: 'setFullData',
}

const factoryMethods = {
  setFeeTo: 'setFeeTo',
  setFeeToSetter: 'setFeeToSetter',
  setAllFeeToProtocol: 'setAllFeeToProtocol',
  allInfo: 'allInfo',
}

export {
  // supportedChainIds,
  pinataGateway,
  pinataApi,
  pinataEndpoints,
  ZERO_ADDRESS,
  storageMethods,
  factoryMethods,
}
