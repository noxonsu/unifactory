import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addList } from 'state/lists/actions'
import { useStorageContract } from './useContract'
import { useProjectInfo } from 'state/application/hooks'
import { StorageState } from 'state/application/reducer'
import { returnValidList } from 'utils/getTokenList'

type Settings = {
  domain: string
  projectName: string
  brandColor: string
  logo: string
  navigationLinks: StorageState['navigationLinks']
  menuLinks: StorageState['menuLinks']
  socialLinks: StorageState['socialLinks']
}

const validArray = (arr: any[]) => Array.isArray(arr) && !!arr.length

export const parseSettings = (settings: string): { application: Settings; lists: any } => {
  let domain: string = ''
  let projectName: string = ''
  let brandColor: string = ''
  let logo: string = ''
  let navigationLinks: StorageState['navigationLinks'] = []
  let menuLinks: Settings['menuLinks'] = []
  let socialLinks: StorageState['socialLinks'] = []
  let addressesOfTokenLists: string[] = []

  try {
    if (settings.length) {
      const settingsJSON = JSON.parse(settings)
      const {
        domain: _domain,
        projectName: _projectName,
        brandColor: _brandColor,
        logoUrl: _logoUrl,
        navigationLinks: _navigationLinks,
        menuLinks: _menuLinks,
        socialLinks: _socialLinks,
        addressesOfTokenLists: _addressesOfTokenLists,
      } = settingsJSON

      if (_domain) domain = _domain
      if (_projectName) projectName = _projectName
      if (_brandColor) brandColor = _brandColor
      if (_logoUrl) logo = _logoUrl

      if (validArray(_navigationLinks)) navigationLinks = _navigationLinks
      if (validArray(_menuLinks)) menuLinks = _menuLinks
      if (validArray(_socialLinks)) socialLinks = _socialLinks
      if (validArray(_addressesOfTokenLists)) addressesOfTokenLists = _addressesOfTokenLists
    }
  } catch (error) {
    console.group('%c Storage settings', 'color: red')
    console.error(error)
    console.groupEnd()
  }

  return {
    application: { domain, projectName, brandColor, logo, navigationLinks, menuLinks, socialLinks },
    lists: { addressesOfTokenLists },
  }
}

export default function useStorageInfo(): { data: StorageState | null; isLoading: boolean; error: Error | null } {
  const dispatch = useDispatch()
  const { storage: storageAddress } = useProjectInfo()
  const [data, setData] = useState<StorageState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const storage = useStorageContract(storageAddress)

  useEffect(() => {
    const fetchData = async () => {
      if (!storageAddress || !storage) return setData(null)

      setError(null)
      setIsLoading(true)

      let parsedSettings: Settings = {
        domain: '',
        projectName: '',
        brandColor: '',
        logo: '',
        navigationLinks: [],
        menuLinks: [],
        socialLinks: [],
      }
      const tokenLists: StorageState['tokenLists'] = []

      try {
        const settings = await storage.settings()
        const { application, lists } = parseSettings(settings)

        if (lists?.addressesOfTokenLists.length) {
          lists.addressesOfTokenLists.forEach((url: string) => dispatch(addList(url)))
        }

        parsedSettings = application
      } catch (error) {
        console.group('%c Storage settings', 'color: red')
        console.error(error)
        console.groupEnd()
        setError(error)
      }

      try {
        const lists = await storage.tokenLists()

        if (lists.length) {
          tokenLists.push(
            ...lists
              .filter((strJson: string) => {
                try {
                  const list = JSON.parse(strJson)

                  list.tokens = list.tokens.map((token: any) => {
                    return {
                      ...token,
                      // some value(s) has to be other types (for now it's only int decimals)
                      // but JSON allows only strings
                      decimals: Number(token.decimals),
                    }
                  })

                  return returnValidList(list)
                } catch (error) {
                  return console.error(error)
                }
              })
              .map((str: string) => JSON.parse(str))
          )
        }
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
