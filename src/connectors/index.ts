import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
// import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
// import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { NetworkConnector } from './NetworkConnector'
import networks from 'networks.json'

export const SUPPORTED_CHAINS = Object.values(networks).reduce(
  (acc, { registry, multicall, wrappedToken, chainId, rpc }) => {
    const supported = registry && multicall && wrappedToken?.address

    if (supported) return { ...acc, [chainId]: rpc }

    return acc
  },
  {}
)

export const supportedChainIds = Object.keys(SUPPORTED_CHAINS).map((id) => Number(id))

export const network = new NetworkConnector({
  urls: SUPPORTED_CHAINS,
  defaultChainId: 4,
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
