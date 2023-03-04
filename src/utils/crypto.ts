import md5 from 'crypto-js/md5'

const generateMd5Hash = (value: string): string => {
  return md5(value).toString()
}

const validateMd5Hash = (value: string, hash: string): boolean => {
  return hash === generateMd5Hash(value)
}

export default {
  generateMd5Hash,
  validateMd5Hash,
}
