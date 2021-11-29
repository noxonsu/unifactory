export * from './compiler'
export * from './contract'
export * from './wallet'
export * from './storage'
export * from './cache'

export const getTimestamp = () => {
  return new Date(Math.floor(new Date().getTime() / 1000) * 1000).toISOString()
}
