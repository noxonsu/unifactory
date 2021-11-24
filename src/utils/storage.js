import axios from 'axios'
import pinataSDK from '@pinata/sdk'
import Storage from '../contracts/build/Storage.json'
import { networks, pinataEndpoints, MAIN_FILE_NAME } from '../constants'
import { getContractInstance } from '../utils'

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

export const saveOptionsToContract = async (
  library,
  storageContract,
  options
) => {
  const {
    projectName = '',
    logoUrl = '',
    brandColor = '',
    tokenLists = [],
  } = options

  const storage = getContractInstance(library, storageContract, Storage.abi)
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  const data = {
    name: projectName,
    logo: logoUrl,
    brandColor,
    listName: '',
    tokens: [],
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

export const fetchOptionsFromContract = async (library, storageContract) => {
  const storage = getContractInstance(library, storageContract, Storage.abi)
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })

  return new Promise((resolve, reject) =>
    storage.methods.project().call().then(resolve).catch(reject)
  )
}
