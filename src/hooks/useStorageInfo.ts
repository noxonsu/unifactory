import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addList } from 'state/lists/actions'
import { useStorageContract } from './useContract'
import { useAppState } from 'state/application/hooks'
import { StorageState } from 'state/application/reducer'
import { returnValidList } from 'utils/getTokenList'
import { useActiveWeb3React } from 'hooks'

type Settings = {
  domain: string
  projectName: string
  brandColor: string
  logo: string
  navigationLinks: StorageState['navigationLinks']
  menuLinks: StorageState['menuLinks']
  socialLinks: StorageState['socialLinks']
  addressesOfTokenLists: StorageState['addressesOfTokenLists']
  disableSourceCopyright: boolean
}

const validArray = (arr: any[]) => Array.isArray(arr) && !!arr.length

const defaultSettings = (): Settings => ({
  domain: '',
  projectName: '',
  brandColor: '',
  logo: '',
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
  disableSourceCopyright: false,
})

export const parseSettings = (settings: string): Settings => {
  const appSettings = defaultSettings()

  try {
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
      disableSourceCopyright: _disableSourceCopyright,
    } = settingsJSON


    if (_domain) appSettings.domain = _domain
    if (_projectName) appSettings.projectName = _projectName
    if (_brandColor) appSettings.brandColor = _brandColor
    if (_logoUrl) appSettings.logo = _logoUrl
    if (Boolean(_disableSourceCopyright)) appSettings.disableSourceCopyright = _disableSourceCopyright

    if (validArray(_navigationLinks)) appSettings.navigationLinks = _navigationLinks
    if (validArray(_menuLinks)) appSettings.menuLinks = _menuLinks
    if (validArray(_socialLinks)) appSettings.socialLinks = _socialLinks
    if (validArray(_addressesOfTokenLists)) appSettings.addressesOfTokenLists = _addressesOfTokenLists
  } catch (error) {
    console.group('%c Storage settings', 'color: red')
    console.error(error)
    console.groupEnd()
  }

  return appSettings
}

export default function useStorageInfo(): { data: StorageState | null; isLoading: boolean; error: Error | null } {
  const dispatch = useDispatch()
  const { storage: storageAddress } = useAppState()
  const [data, setData] = useState<StorageState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { library } = useActiveWeb3React()

  const storage = useStorageContract(storageAddress)

  useEffect(() => {
    const fetchData = async () => {
      if (!storageAddress || !storage) return setData(null)
      // get address code on network switching and don't do anything
      // if we get '0x' code (means we still haven't updated the storage address)
      const code = await library?.getCode(storageAddress)

      if (code === '0x') return setData(null)

      setError(null)
      setIsLoading(true)

      let parsedSettings = defaultSettings()
      const tokenLists: StorageState['tokenLists'] = []

      try {
        const settings = await storage.settings()
        const data = parseSettings(settings)

        if (data.addressesOfTokenLists?.length) {
          data.addressesOfTokenLists.forEach((url: string) => dispatch(addList(url)))
        }

        parsedSettings = data
      } catch (error) {
        console.group('%c Storage settings', 'color: red')
        console.error(error)
        console.groupEnd()
        setError(error)
      }

      try {
        const lists = await storage.tokenLists()

        if (lists.length) {
          const filtered = lists
            .filter((strJson: string) => {
              try {
                const list = JSON.parse(strJson)
                const namePattern = /^[ \w.'+\-%/À-ÖØ-öø-ÿ:]+$/

                list.tokens = list.tokens
                  // filter not valid token before actuall external validation
                  // to leave the option of showing the entire token list
                  // (without it token list won't be displayed with an error in at least one token)
                  .filter((token: { name: string }) => token.name.match(namePattern))
                  .map((token: { decimals: number }) => ({
                    ...token,
                    // some value(s) has to be other types (for now it's only decimals)
                    // but JSON allows only strings
                    decimals: Number(token.decimals),
                  }))

                return returnValidList(list)
              } catch (error) {
                return console.error(error)
              }
            })
            .map((str: string) => JSON.parse(str))

          tokenLists.push(...filtered)
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
  }, [storageAddress, storage, library, dispatch])

  return { data, isLoading, error }
}
