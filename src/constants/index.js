const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const storageMethods = {
  setDomain: 'setDomain',
  setProjectName: 'setProjectName',
  setLogoUrl: 'setLogoUrl',
  setBrandColor: 'setBrandColor',
  addTokenList: 'addTokenList',
  addTokenLists: 'addTokenLists',
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

export { ZERO_ADDRESS, storageMethods, factoryMethods }
