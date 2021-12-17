import { Web3Provider } from '@ethersproject/providers'
import Storage from 'contracts/build/Storage.json'
import { storageMethods } from '../constants'
import { getTimestamp } from './index'
import { getContractInstance } from './contract'

export const getStorage = (library: Web3Provider, address: string) => {
  return getContractInstance(library, address, Storage.abi)
}

export const saveAllOptions = async (library: Web3Provider, storageAddress: string, options: any) => {
  const { projectName, logoUrl, brandColor, listName, tokens } = options
  const storage = getStorage(library, storageAddress)
  //@ts-ignore
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const data = {
    name: projectName,
    logo: logoUrl,
    brandColor,
    listName,
    tokens,
  }

  return new Promise((resolve, reject) => {
    storage.methods
      .addFullData(data)
      .send({
        from: accounts[0],
      })
      .then((response: any) => {
        storage.methods.project().call().then(resolve).catch(reject)
      })
      .catch(reject)
  })
}

export const fetchOptionsFromContract = async (library: Web3Provider, storageAddress: string) => {
  const storage = getStorage(library, storageAddress)

  return new Promise(async (resolve, reject) => {
    try {
      const project = await storage.methods.project().call()
      const tokenLists = await storage.methods.tokenLists().call()

      resolve({ ...project, tokenLists })
    } catch (error) {
      const match = error.message.match(/Returned values aren't valid/)

      if (match) {
        return reject(
          new Error('Invalid values. Seems it is a wrong contract address or an address from a different network.')
        )
      }

      reject(error)
    }
  })
}

const returnValidTokenListJSON = (params: any) => {
  const { name, tokens, logoURI } = params

  return JSON.stringify({
    name,
    logoURI,
    timestamp: getTimestamp(),
    // TODO: track interface changes and change this version
    /* 
    Increment major version when tokens are removed
    Increment minor version when tokens are added
    Increment patch version when tokens already on the list have minor details changed (name, symbol, logo URL, decimals)
    */
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    tokens,
  })
}

export const saveProjectOption = async (library: Web3Provider, storageAddress: string, method: string, value: any) => {
  const storage = getStorage(library, storageAddress)
  //@ts-ignore
  const accounts = await window?.ethereum?.request({ method: 'eth_accounts' })
  let args: any

  switch (method) {
    case storageMethods.setDomain:
      args = [value]
      break
    case storageMethods.setProjectName:
      args = [value]
      break
    case storageMethods.setLogoUrl:
      args = [value]
      break
    case storageMethods.setBrandColor:
      args = [value]
      break
    case storageMethods.addTokenList:
      args = [value.name, returnValidTokenListJSON(value)]
      break
    case storageMethods.updateTokenList:
      args = [value.oldName, value.name, returnValidTokenListJSON(value)]
      break
    case storageMethods.removeTokenList:
      args = [value]
      break
    case storageMethods.setFullData:
      args = [{ ...value }]
      break
    default:
      method = ''
      args = []
  }

  if (method) {
    return new Promise(async (resolve, reject) => {
      storage.methods[method](...args)
        .send({ from: accounts[0] })
        .then(resolve)
        .catch(reject)
    })
  } else {
    throw new Error('No such method')
  }
}
