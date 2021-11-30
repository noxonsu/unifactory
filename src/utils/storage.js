import axios from 'axios'
import pinataSDK from '@pinata/sdk'
import Storage from '../contracts/build/Storage.json'
import { pinataEndpoints, storageMethods } from '../constants'
import { getContractInstance, getTimestamp } from '../utils'

// TODO: track request limits
// * take a minimum Pinata limits (30 request per minute)

export const generateNewKeys = async (adminApiKey, adminSecretApiKey) => {
  const { REACT_APP_SERVER_IP, REACT_APP_SERVER_PORT } = process.env

  if (!REACT_APP_SERVER_IP || !REACT_APP_SERVER_PORT) {
    throw new Error('No destination')
  }

  return new Promise((resolve, reject) => {
    axios
      .get(`https://${REACT_APP_SERVER_IP}:${REACT_APP_SERVER_PORT}/newKeys`)
      .then((response) => {
        console.log('server response: ', response)

        /*
          {
            "pinata_api_key": "",
            "pinata_api_secret": "",
            "JWT": ""
          }
        */
        resolve(response.data)
      })
      .catch(reject)
  })
}

export const getData = async (contentHash) => {
  if (!contentHash.match(/[a-zA-Z0-9]/)) {
    return new Error('Incorrect file hash')
  }

  return new Promise((resolve, reject) => {
    axios
      .get(`${pinataEndpoints.ipfs}/${contentHash}`)
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}

export const pinJson = async (apiKey, secretApiKey, body) => {
  const pinata = pinataSDK(apiKey, secretApiKey)

  return new Promise((resolve, reject) => {
    pinata.pinJSONToIPFS(body).then(resolve).catch(reject)
  })
}

export const getStorage = (library, address) => {
  return getContractInstance(library, address, Storage.abi)
}

export const saveAllOptions = async (library, storageAddress, options) => {
  const { projectName, logoUrl, brandColor, listName, tokens } = options

  const storage = getStorage(library, storageAddress)
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
      .then((response) => {
        storage.methods.project().call().then(resolve).catch(reject)
      })
      .catch(reject)
  })
}

export const fetchOptionsFromContract = async (library, storageAddress) => {
  const storage = getStorage(library, storageAddress)

  return new Promise(async (resolve, reject) => {
    try {
      const project = await storage.methods.project().call()
      const tokenLists = await storage.methods.tokenLists().call()

      resolve({ ...project, tokenLists })
    } catch (error) {
      reject(error)
    }
  })
}

export const saveProjectOption = async (
  library,
  storageAddress,
  method,
  value
) => {
  const storage = getStorage(library, storageAddress)
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  let args

  const validTokenList = {
    name: value.name,
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
    tokens: value.tokens,
  }

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
      args = [value.name, JSON.stringify(validTokenList)]
      break
    case storageMethods.updateTokenList:
      args = [value.oldName, value.name, JSON.stringify(validTokenList)]
      break
    case storageMethods.removeTokenList:
      args = [value]
      break
    case storageMethods.setFullData:
      args = [{ ...value, tokens: value.tokens.map((item) => item.address) }]
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
