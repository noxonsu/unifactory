import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { NetworkConnector } from './NetworkConnector'
import networks from 'networks.json'

export const SUPPORTED_NETWORKS = Object.values(networks).reduce(
  (acc, { registry, multicall, wrappedToken, chainId, rpc }) => {
    const supported = registry && multicall && wrappedToken?.address

    if (supported) return { ...acc, [chainId]: rpc }

    return acc
  },
  {}
)

export const supportedChainIds = Object.keys(SUPPORTED_NETWORKS).map((id) => Number(id))

export const network = new NetworkConnector({
  urls: SUPPORTED_NETWORKS,
  defaultChainId: 4,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds,
})

export const newWalletConnect = (chainId: number) =>
  new WalletConnectConnector({
    //@ts-ignore
    rpc: { [networks[chainId].chainId]: networks[networks[chainId].chainId].rpc },
    bridge: 'https://bridge.walletconnect.org',
    qrcode: true,
    pollingInterval: 15000,
  })

export const newWalletlink = (chainId: number, appName = '', appLogoUrl = '') =>
  new WalletLinkConnector({
    //@ts-ignore
    url: networks[chainId].rpc,
    appName,
    appLogoUrl,
  })
