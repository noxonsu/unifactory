import networks from '../networks.json'

export const supportedChainIds = [
  networks[1].chainId,
  networks[56].chainId,
  networks[137].chainId,
  networks[3].chainId,
  networks[4].chainId,
  networks[97].chainId,
  networks[80001].chainId,
]

export const pinataGateway = 'https://gateway.pinata.cloud'
export const pinataApi = 'https://api.pinata.cloud'
export const pinataEndpoints = {
  generateApiKeys: `${pinataApi}/users/generateApiKey`,
  ipfs: `${pinataGateway}/ipfs`,
  pinJSONToIPFS: `${pinataApi}/pinning/pinJSONToIPFS`,
  pinList: `${pinataApi}/data/pinList`,
}

export const MAIN_FILE_NAME = 'swapProject.json'

export const storageMethods = {
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

export const factoryMethods = {
  setFeeTo: 'setFeeTo',
  setFeeToSetter: 'setFeeToSetter',
  setAllFeeToProtocol: 'setAllFeeToProtocol',
}
