import { InjectedConnector } from '@web3-react/injected-connector'
import Web3 from 'web3'
import networks from 'networks.json'

// @ts-ignore
export const injected = new InjectedConnector()

export const getLibrary = (provider: any) => {
  return new Web3(provider)
}

export const addInjectedNetwork = async (chainId: number) => {
  //@ts-ignore
  const network = networks[chainId]

  if (!(network && window.ethereum?.request)) return false

  const successfulResult = null
  const { name, baseCurrency, rpc, explorer } = network

  const params = {
    chainId: `0x${chainId.toString(16)}`,
    chainName: name,
    nativeCurrency: {
      name: baseCurrency.name,
      symbol: baseCurrency.symbol,
      decimals: baseCurrency.decimals,
    },
    rpcUrls: [rpc],
    blockExplorerUrls: [explorer],
  }

  try {
    const result = await window.ethereum?.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    })

    return result === successfulResult
  } catch (error) {
    console.group('%c new network addition', 'color: red;')
    console.error(error)
    console.groupEnd()
  }

  return false
}

export const switchInjectedNetwork = async (chainId: number) => {
  if (!window.ethereum?.request) return false

  const ADD_CHAIN_ERROR_CODE = 4902 // from Metamask docs
  const successfulResult = null

  try {
    const result = await window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })

    return result === successfulResult
  } catch (error) {
    const messageAboutAddition = JSON.stringify(error).match(/(T|t)ry adding the chain/)

    if (error.code === ADD_CHAIN_ERROR_CODE || messageAboutAddition) {
      return await addInjectedNetwork(chainId)
    } else {
      console.group('%c switch network', 'color: red;')
      console.error(error)
      console.groupEnd()
    }

    return false
  }
}
