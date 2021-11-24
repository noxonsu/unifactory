import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import Web3 from 'web3'
import { networks, supportedChainIds } from '../constants'

export const injected = new InjectedConnector({
  supportedChainIds,
})

export const walletconnect = new WalletConnectConnector({
  rpc: { 80001: networks[80001].rpc },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000,
})

export const getLibrary = (provider, connector) => {
  return new Web3(provider)
}
