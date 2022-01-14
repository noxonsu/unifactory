import { Contract } from '@ethersproject/contracts'
import { useWrappedToken } from 'hooks/useToken'
import { useMemo } from 'react'
import ENS_PUBLIC_RESOLVER_ABI from 'constants/abis/ens-public-resolver.json'
import FACTORY from 'contracts/build/Factory.json'
import PAIR from 'contracts/build/Pair.json'
import STORAGE from 'contracts/build/Storage.json'
import REGISTRY from 'contracts/build/Registry.json'
import ENS_ABI from 'constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from 'constants/abis/erc20'
import ERC20_ABI from 'constants/abis/erc20.json'
import WETH_ABI from 'constants/abis/weth.json'
import MULTICALL_ABI from 'constants/abis/multicallAbi.json'
import { getContract } from 'utils'
import { useActiveWeb3React } from './index'
import networks from 'networks.json'

export function useRegistryContract(address: string | undefined): Contract | null {
  const { library } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !library) return null

    try {
      return new Contract(address, REGISTRY.abi, library)
    } catch (error) {
      console.error('Failed to get Registry contract', error)
      return null
    }
  }, [address, library])
}

export function useStorageContract(address: string | undefined): Contract | null {
  const { library } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !library) return null

    try {
      return new Contract(address, STORAGE.abi, library)
    } catch (error) {
      console.error('Failed to get Storage contract', error)
      return null
    }
  }, [address, library])
}

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useFactoryContract(address: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, FACTORY.abi, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, PAIR.abi, withSignerIfPossible)
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  const wrappedToken = useWrappedToken()

  return useContract(chainId && wrappedToken ? wrappedToken.address : undefined, WETH_ABI, withSignerIfPossible)
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined

  // @ts-ignore
  if (chainId) address = networks[chainId]?.ENSRegistry

  return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function useMulticallContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  //@ts-ignore
  return useContract(chainId ? networks[chainId].multicall : '', MULTICALL_ABI, false)
}
