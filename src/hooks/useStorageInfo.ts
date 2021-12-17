import { useEffect, useState } from 'react'
import { useStorageContract } from './useContract'
import { useProjectInfo } from '../state/application/hooks'

type Settings = {
  domain: string
  projectName: string
  brandColor: string
  logo: string
  socialLinks: string[]
}

type Data = {
  tokenLists: string[]
} & Settings

const parseSettings = (settings: string): Settings => {
  let domain: string = ''
  let projectName: string = ''
  let brandColor: string = ''
  let logo: string = ''
  let socialLinks: string[] = []

  try {
    if (settings.length) {
      const settingsJSON = JSON.parse(settings)
      const {
        domain: _domain,
        projectName: _projectName,
        brandColor: _brandColor,
        logo: _logo,
        socialLinks: _socialLinks,
      } = settingsJSON

      if (_domain) domain = _domain
      if (_projectName) projectName = _projectName
      if (_brandColor) brandColor = _brandColor
      if (_logo) logo = _logo
      if (Array.isArray(_socialLinks) && _socialLinks.length) socialLinks = _socialLinks
    }
  } catch (error) {
    console.group('%c Storage settings', 'color: red')
    console.error(error)
    console.groupEnd()
  }

  return {
    domain,
    projectName,
    brandColor,
    logo,
    socialLinks,
  }
}

// TODO: describe storage data
export default function useStorageInfo(): { data: any | null; isLoading: boolean; error: Error | null } {
  const { storage: storageAddress } = useProjectInfo()
  const [data, setData] = useState<Data | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const storage = useStorageContract(storageAddress)

  useEffect(() => {
    const fetchData = async () => {
      if (!storageAddress || !storage) return setData(null)

      setError(null)
      setIsLoading(true)

      let parsedSettings: Settings = { domain: '', projectName: '', brandColor: '', logo: '', socialLinks: [] }
      let tokenLists: string[] = []

      try {
        const settings = await storage.settings()
        const parsed = parseSettings(settings)

        parsedSettings = parsed
      } catch (error) {
        console.group('%c Storage settings', 'color: red')
        console.error(error)
        console.groupEnd()
        setError(error)
      }

      try {
        const lists = await storage.tokenLists()

        tokenLists = lists
      } catch (error) {
        console.group('%c Storage token lists', 'color: red')
        console.error(error)
        console.groupEnd()
        setError(error)
      }

      setData({ ...parsedSettings, tokenLists })
      setIsLoading(false)
    }

    fetchData()
  }, [storage, storageAddress])

  return { data, isLoading, error }
}
