import { Web3Provider } from '@ethersproject/providers'
import Storage from 'contracts/build/Storage.json'
import { STORAGE, STORAGE_APP_KEY, StorageMethod } from '../constants'
import { getTimestamp } from './index'
import { getContractInstance } from './contract'
import { getCurrentDomain } from 'utils/app'

export const getStorage = (library: Web3Provider, address: string) => {
  return getContractInstance(library, address, Storage.abi)
}

const returnValidTokenListJSON = (params: any) => {
  const { name, tokens, logoURI } = params
  const list: any = {
    name,
    timestamp: getTimestamp(),
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

type Data = { [k: string]: any }

const updateData = (oldData: Data, newData: Data) => {
  return {
    ...oldData,
    [STORAGE_APP_KEY]: {
      ...oldData[STORAGE_APP_KEY],
      ...newData,
      contracts: {
        ...oldData[STORAGE_APP_KEY].contracts,
        ...newData.contracts,
      },
    },
  }
}

export const saveAppData = async (params: {
  library: Web3Provider
  owner: string
  data: Data
  onHash?: (hash: string) => void
  onReceipt?: (receipt: object, success: boolean) => void
}) => {
  const { library, owner, data, onHash, onReceipt } = params

  console.group('%c save option', 'color: pink; font-size: 20px')
  console.log('params: ', params)
  console.log(returnValidTokenListJSON)
  console.groupEnd()

  try {
    const storage = getStorage(library, STORAGE)
    const { info } = await storage.methods.getData(getCurrentDomain()).call()

    console.log('Old data: ', JSON.parse(info))

    const newData = updateData(JSON.parse(info), data)

    console.log('newData: ', newData)

    return new Promise(async (resolve, reject) => {
      storage.methods
        .setKeyData(getCurrentDomain(), {
          owner,
          info: JSON.stringify(newData),
        })
        .send({ from: owner })
        .on('transactionHash', (hash: string) => {
          if (typeof onHash === 'function') onHash(hash)
        })
        .on('receipt', (receipt: any) => {
          if (typeof onReceipt === 'function') onReceipt(receipt, receipt?.status)
        })
        .then(resolve)
        .catch(reject)
    })
  } catch (error) {
    throw error
  }
}

export const resetAppData = async ({ library, owner }: { library: any; owner: string }) => {
  try {
    const storage = getStorage(library, STORAGE)
    const domain = getCurrentDomain()
    const { info } = await storage.methods[StorageMethod.getData](domain).call()

    const parsedData = JSON.parse(info)
    const newData = { ...parsedData, [STORAGE_APP_KEY]: {} }

    await storage.methods[StorageMethod.setKeyData](domain, {
      owner,
      info: JSON.stringify(newData),
    }).send({
      from: owner,
    })
  } catch (error) {
    console.error('Reset app data')
    console.error(error)
  }
}
