import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
// import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
// import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { NetworkConnector } from './NetworkConnector'
import networks from 'networks.json'

export const supportedChainIds = Object.values(networks)
  .filter((network) => Boolean(network.registry))
  .map((network) => network.chainId)

export const network = new NetworkConnector({
  //@ts-ignore
  urls: { [networks[1].chainId]: networks[networks[1].chainId].rpc },
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds,
})

/* 
TODO: make interface with all available network options
=> display networks in interface
=> user choose the network 
=> we create a new instance for one of wallets below with that network
=> display connector
*/
// export const walletconnect = new WalletConnectConnector({
//   //@ts-ignore
//   rpc: { [networks[1].chainId]: networks[networks[1].chainId].rpc },
//   bridge: 'https://bridge.walletconnect.org',
//   qrcode: true,
//   pollingInterval: 15000,
// })

// export const walletlink = new WalletLinkConnector({
//   url: networks[1].rpc,
//   appName: 'Swap',
//   appLogoUrl: '',
// })
