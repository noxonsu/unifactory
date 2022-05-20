import { Web3Provider } from '@ethersproject/providers'
import Storage from 'contracts/build/Storage.json'
import { STORAGE, STORAGE_APP_KEY, StorageMethod } from '../constants'
import { getTimestamp } from './index'
import { getContractInstance } from './contract'
import { getCurrentDomain } from 'utils/app'

export const getStorage = (library: Web3Provider, address: string) => {
  return getContractInstance(library, address, Storage.abi)
}

type TokenList = {
  oldChainId: number
  oldId: string
  chainId: number
  id: string
  oldName: string
  name: string
  logoURI?: string
  tokens: any[]
}

type TokenLists = {
  [chainId: number]: {
    [tokenId: string]: TokenList
  }
}

const returnValidTokenListJSON = (tokenList: TokenList) => {
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

const isEmptyChain = (tokenLists: { [chainId: string]: any }, chainId: number) => {
  return !Object.keys(tokenLists[chainId])?.length
}

export const updateTokenLists = (oldTokenLists: TokenLists, newTokenList: TokenList) => {
  const { oldChainId, oldId, chainId, id } = newTokenList

  const tokenLists = {
    ...oldTokenLists,
    [chainId]: {
      ...oldTokenLists[chainId],
      [id]: returnValidTokenListJSON(newTokenList),
    },
  }

  if (chainId !== oldChainId) {
    delete tokenLists[oldChainId][oldId]
  } else if (id !== oldId) {
    delete tokenLists[chainId][oldId]
  }

  if (isEmptyChain(tokenLists, oldChainId)) {
    delete tokenLists[oldChainId]
  }

  if (isEmptyChain(tokenLists, chainId)) {
    delete tokenLists[chainId]
  }

  return tokenLists
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
    const { info } = await storage.methods[StorageMethod.getData](oldDomain).call()

    await storage.methods[StorageMethod.setKeyData](newDomain, {
      owner,
      info,
    }).send({
      from: owner,
    })
    await storage.methods[StorageMethod.clearKeyData](oldDomain).send({
      from: owner,
    })
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
