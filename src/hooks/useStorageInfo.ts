import { useEffect, useState } from 'react'
import { useStorageContract } from './useContract'
import { useProjectInfo } from '../state/application/hooks'

// TODO: describe storage data
export default function useStorageInfo(): { data: any | null; isLoading: boolean; error: Error | null } {
  const { storage: storageAddress } = useProjectInfo()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const storage = useStorageContract(storageAddress)

  useEffect(() => {
    const fetchData = async () => {
      if (!storageAddress || !storage) return setData(null)

      setError(null)
      setIsLoading(true)

      try {
        const data = await storage.project()
        const tokenLists = await storage.tokenLists()
        const socialLinks: string[] = [] //await storage.socialLinks();

        setData({ ...data, tokenLists, socialLinks })
      } catch (error) {
        console.error(error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [storage, storageAddress])

  return { data, isLoading, error }
}
