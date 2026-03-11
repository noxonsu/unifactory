import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { fetchDomainData, getCurrentDomain } from '../storage/contract'
import { StorageConfig } from '../storage/types'

export function useStorageConfig(): {
  config: StorageConfig | null
  loading: boolean
  error: Error | null
  domain: string
} {
  const domain = getCurrentDomain()
  const chainId = useChainId()

  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-config', domain, chainId],
    queryFn: () => fetchDomainData(domain, chainId),
    staleTime: 60_000,
    retry: 2,
  })

  return {
    config: data ?? null,
    loading: isLoading,
    error: error as Error | null,
    domain,
  }
}
