import { Web3Provider } from '@ethersproject/providers'
import Storage from 'contracts/build/Storage.json'
import { storageMethods, STORAGE } from '../constants'
import { getTimestamp } from './index'
import { getContractInstance } from './contract'

export const getStorage = (library: Web3Provider, address: string) => {
  return getContractInstance(library, address, Storage.abi)
}

const returnValidTokenListJSON = (params: any) => {
  const { name, tokens, logoURI } = params
  const list: any = {
    name,
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
  }

  if (logoURI) list.logoURI = logoURI

  return JSON.stringify(list)
}

export const saveProjectOption = async (params: {
  library: Web3Provider
  method: string
  value: any
  onHash?: (hash: string) => void
}) => {
  const { library, method, value, onHash } = params

  const storage = getStorage(library, STORAGE)
  //@ts-ignore
  const accounts = await window?.ethereum?.request({ method: 'eth_accounts' })
  let args: any

  switch (method) {
    case storageMethods.setSettings:
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
    default:
      args = []
  }

  if (method) {
    return new Promise(async (resolve, reject) => {
      storage.methods[method](...args)
        .send({ from: accounts[0] })
        .on('transactionHash', (hash: string) => {
          if (typeof onHash === 'function') onHash(hash)
        })
        .then(resolve)
        .catch(reject)
    })
  } else {
    throw new Error('No such method')
  }
}
