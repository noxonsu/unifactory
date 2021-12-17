import { InjectedConnector } from '@web3-react/injected-connector'
import Web3 from 'web3'

// @ts-ignore
export const injected = new InjectedConnector()

export const getLibrary = (provider: any) => {
  return new Web3(provider)
}
