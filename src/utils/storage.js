const axios = require('axios')

const gateway = 'https://gateway.pinata.cloud'
const pinataApi = 'https://api.pinata.cloud'

// TODO: track request limits
// * take a minimum Pinata limits (30 request per minute)

// TODO: how to validate a file hash?
export const getData = async (contentHash) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${gateway}/ipfs/${contentHash}`)
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}

export const authentication = () => {
  const url = `${pinataApi}/data/`

  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        headers: {
          pinata_api_key: '',
          pinata_secret_api_key: '',
        },
      })
      .then((response) => resolve(response.data))
      .catch(reject)
  })
}
