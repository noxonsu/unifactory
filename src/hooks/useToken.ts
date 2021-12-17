import { useMemo } from 'react'
import { Token } from 'sdk'
import { useActiveWeb3React } from 'hooks'
import networks from 'networks.json'

export function useWrappedToken(): Token | null {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    //@ts-ignore
    if (!chainId || !networks[chainId]?.wrappedToken?.address) return null
    //@ts-ignore
    const { wrappedToken } = networks[chainId]

    try {
      return new Token(chainId, wrappedToken.address, 18, wrappedToken.symbol, wrappedToken.name)
    } catch (error) {
      console.error('Failed to use Wrapped token: ', error)
      return null
    }
  }, [chainId])
}
