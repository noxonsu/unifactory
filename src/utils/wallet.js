import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import Web3 from 'web3'
import { networks } from '../constants'

export const injected = new InjectedConnector({
  supportedChainIds: [
    networks[1].chainId,
    networks[56].chainId,
    networks[137].chainId,
    networks[4].chainId,
    networks[97].chainId,
    networks[80001].chainId,
  ],
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
