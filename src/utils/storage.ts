import { Web3Provider } from '@ethersproject/providers'
import Storage from 'contracts/build/Storage.json'
import { STORAGE, STORAGE_APP_KEY, StorageMethod } from '../constants'
import { getTimestamp } from './index'
import { getContractInstance } from './contract'
import { getCurrentDomain } from 'utils/app'

export const getStorage = (library: Web3Provider, address: string) => {
  return getContractInstance(library.provider, address, Storage.abi)
}

const returnValidTokenListJSON = (tokenList: {
  oldChainId: number
  chainId: number
  id: string
  oldName: string
  name: string
  logoURI?: string
  tokens: any[]
}) => {
  const { oldChainId, chainId, name, tokens, logoURI } = tokenList

  const list: any = {
    name,
    timestamp: getTimestamp(),
    version: {
      // Increment major version when tokens are removed
      major: 1,
      // Increment minor version when tokens are added
      minor: 0,
      // Increment patch version when tokens already on the list have details changed (name, symbol, logo URL, decimals)
      patch: 0,
    },
    tokens: chainId !== oldChainId ? tokens.map((token) => ({ ...token, chainId })) : tokens,
  }

  if (logoURI) list.logoURI = logoURI

  return list
}

type Data = { [k: string]: any }

const makeBaseStructure = (data: { [k: string]: any }) => {
  if (!data[STORAGE_APP_KEY]) {
    data[STORAGE_APP_KEY] = {}
  }
  if (!data[STORAGE_APP_KEY].contracts) {
    data[STORAGE_APP_KEY].contracts = {}
  }
  if (!data[STORAGE_APP_KEY].tokenLists) {
    data[STORAGE_APP_KEY].tokenLists = {}
  }
  if (!data[STORAGE_APP_KEY].additions) {
    data[STORAGE_APP_KEY].additions = {}
  }

  return data
}

const isEmptyChain = (tokenLists: { [chainId: string]: any }, chainId: string) => {
  return !Object.keys(tokenLists[chainId])?.length
}

// @todo Update data with recursion. Get rid of this mess.
const updateData = (oldData: Data, newData: Data) => {
  oldData = makeBaseStructure(oldData)

  let result

  // Update all token lists
  if (newData.tokenLists) {
    result = {
      ...oldData,
      [STORAGE_APP_KEY]: {
        ...oldData[STORAGE_APP_KEY],
        tokenLists: newData.tokenLists,
      },
    }
    // Update or add one token list
  } else if (newData.tokenList) {
    const { oldChainId, oldId, chainId, id } = newData.tokenList

    const tokenLists = {
      ...oldData[STORAGE_APP_KEY].tokenLists,
      [chainId]: {
        ...oldData[STORAGE_APP_KEY].tokenLists[chainId],
        [id]: returnValidTokenListJSON(newData.tokenList),
      },
    }

    if (chainId !== oldChainId) {
      tokenLists[oldChainId][oldId] = undefined
    } else if (id !== oldId) {
      tokenLists[chainId][oldId] = undefined
    }

    if (isEmptyChain(tokenLists, oldChainId)) {
      tokenLists[oldChainId] = undefined
    }

    if (isEmptyChain(tokenLists, chainId)) {
      tokenLists[chainId] = undefined
    }

    result = {
      ...oldData,
      [STORAGE_APP_KEY]: {
        ...oldData[STORAGE_APP_KEY],
        tokenLists,
      },
    }
  } else {
    result = {
      ...oldData,
      [STORAGE_APP_KEY]: {
        ...oldData[STORAGE_APP_KEY],
        ...newData,
        contracts: {
          ...oldData[STORAGE_APP_KEY].contracts,
          ...newData.contracts,
        },
        tokenLists: {
          ...oldData[STORAGE_APP_KEY].tokenLists,
          ...newData.tokenLists,
        },
        additions: {
          ...oldData[STORAGE_APP_KEY].additions,
          ...newData.additions,
        },
      },
    }
  }

  return result
}

export const saveAppData = async (params: {
  library: Web3Provider
  owner: string
  data: Data
  onHash?: (hash: string) => void
  onReceipt?: (receipt: object, success: boolean) => void
}) => {
  const { library, owner, data, onHash, onReceipt } = params

  try {
    const storage = getStorage(library, STORAGE)
    const { info } = await storage.methods.getData(getCurrentDomain()).call()

    const newData = updateData(JSON.parse(info || '{}'), data)

    return new Promise((resolve, reject) => {
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

export const migrateToNewDomain = async ({
  oldDomain,
  newDomain,
  library,
  owner,
}: {
  oldDomain: string
  newDomain: string
  library: any
  owner: string
}) => {
  try {
    const storage = getStorage(library, STORAGE)
    const { info } = await storage.methods[StorageMethod.getData](oldDomain.toLowerCase()).call()
    const receipt = await storage.methods[StorageMethod.setKeyData](newDomain.toLowerCase(), {
      owner,
      info,
    }).send({
      from: owner,
    })

    await storage.methods[StorageMethod.clearKeyData](oldDomain.toLowerCase()).send({
      from: owner,
    })

    return { hash: receipt?.transactionHash || '' }
  } catch (error) {
    console.error(error)
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
    console.error(error)
    throw error
  }
}
