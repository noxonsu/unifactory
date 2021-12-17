import { useEffect, useState } from 'react'
import { ZERO_ADDRESS } from 'sdk'
import { useRegistryContract } from './useContract'
import { useActiveWeb3React } from 'hooks'
import networks from 'networks.json'

export default function useDomainInfo(): {
  data: { admin: string; factory: string; router: string; storage: string } | null
  isLoading: boolean
  error: Error | null
} {
  const { chainId } = useActiveWeb3React()

  // @ts-ignore
  const registry = useRegistryContract(networks[chainId]?.registry)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!registry) return setData(null)

      setError(null)
      setIsLoading(true)

      try {
        const currentDomain = window.location.hostname || document.location.host
        const data = await registry.domainData(currentDomain)
        let storage = await registry.domainStorage(currentDomain)

        if (storage === ZERO_ADDRESS) storage = ''

        setData({ ...data, storage })
      } catch (error) {
        console.error(error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [registry])

  return { data, isLoading, error }
}
