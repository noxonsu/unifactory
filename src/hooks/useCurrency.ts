import { useMemo } from 'react'
import { BaseCurrency } from 'sdk'
import { useActiveWeb3React } from 'hooks'

export function useBaseCurrency(): BaseCurrency | null {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    if (!chainId) return null

    try {
      return new BaseCurrency(chainId)
    } catch (error) {
      console.error('Failed to use Base currency: ', error)
      return null
    }
  }, [chainId])
}
