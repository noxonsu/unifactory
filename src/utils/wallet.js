import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import Web3 from 'web3'
import networks from '../networks.json'

export const injected = new InjectedConnector()

// TODO: make a better interface with the ability to
// choose between networks and then connect through WalletConnect
export const walletconnect = new WalletConnectConnector({
  rpc: { 80001: networks[80001].rpc },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000,
})

export const getLibrary = (provider, connector) => {
  return new Web3(provider)
}
