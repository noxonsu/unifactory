import axios from 'axios'
import pinataSDK from '@pinata/sdk'
import { pinataEndpoints, MAIN_FILE_NAME } from '../constants'

// ! ADMIN api keys
// TODO: we have to use all logic, that related to
// these keys, on the server
// const pinata = pinataSDK(
//   process.env.REACT_APP_PINATA_API_KEY,
//   process.env.REACT_APP_PINATA_SECRET_API_KEY
// )

// TODO: track request limits
// * take a minimum Pinata limits (30 request per minute)

// TODO: server logic
export const generateApiKey = (adminApiKey, adminSecretApiKey) => {
  const body = {
    keyName: 'Example Key',
    permissions: {
      endpoints: {
        data: {
          userPinnedDataTotal: true,
        },
        pinning: {
          pinJobs: true,
          unpin: true,
          userPinPolicy: true,
        },
      },
    },
  }

  return new Promise((resolve, reject) => {
    axios
      .post(pinataEndpoints.generateApiKeys, body, {
        headers: {
          pinata_api_key: adminApiKey,
          pinata_secret_api_key: adminSecretApiKey,
        },
      })
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}

// TODO: deside - remove or not?
export const authentication = async (apiKey, secretKey) => {
  return new Promise((resolve, reject) => {
    axios
      .get(pinataEndpoints.authentication, {
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: secretKey,
        },
      })
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}

// TODO: how to validate a file hash?
export const getData = async (contentHash) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${pinataEndpoints.ipfs}/${contentHash}`)
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}

export const getAllData = (apiKey, secretApiKey) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${pinataEndpoints.pinList}?status=pinned`, {
        headers: {
          pinata_api_key: apiKey,
          pinata_secret_api_key: secretApiKey,
        },
      })
      .then((response) => {
        if (response?.data?.count) {
          const { rows } = response.data
          const targetData = rows.find(
            (item) => item.metadata?.name === MAIN_FILE_NAME
          )

          if (targetData?.ipfs_pin_hash) {
            resolve(getData(targetData.ipfs_pin_hash))
          } else {
            resolve(undefined)
          }
        } else {
          resolve(undefined)
        }
      })
      .catch(reject)
  })
}

export const pinJson = async (apiKey, secretApiKey, body) => {
  const options = {
    pinataMetadata: {
      name: MAIN_FILE_NAME,
    },
  }
  const pinata = pinataSDK(apiKey, secretApiKey)

  return new Promise((resolve, reject) => {
    pinata
      .pinJSONToIPFS(body, options)
      .then((result) => resolve(result))
      .catch(reject)
  })
}
