import { useEffect, useState } from 'react'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { ZERO_ADDRESS } from 'sdk'
import { Contract } from '@ethersproject/contracts'
import FACTORY from 'contracts/build/Factory.json'
import STORAGE from 'contracts/build/Storage.json'
import { useDispatch } from 'react-redux'
import { useRegistryContract } from './useContract'
import { useActiveWeb3React } from 'hooks'
import { getContractInstance } from 'utils/contract'
import { returnValidList } from 'utils/getTokenList'
import { addList } from 'state/lists/actions'
import { DomainData } from 'state/application/reducer'
import networks from 'networks.json'

const validArray = (arr: any[]) => Array.isArray(arr) && !!arr.length

const defaultStorageSettings = () => ({
  domain: '',
  projectName: '',
  brandColor: '',
  logo: '',
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
  disableSourceCopyright: false,
  tokenLists: [],
})

export const parseSettings = (settings: string) => {
  const appSettings = defaultStorageSettings()

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
    console.group('%c Parse storage data', 'color: red')
    console.error(error)
    console.log('settings: ', settings)
    console.groupEnd()
  }

  return appSettings
}

export default function useDomainInfo(trigger: boolean): {
  data: DomainData | null
  isLoading: boolean
  error: Error | null
} {
  const { chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch()
  // @ts-ignore
  const registry = useRegistryContract(networks[chainId]?.registry)
  const [registryData, setRegistryData] = useState<any>(null)
  const [data, setData] = useState<null | DomainData>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStorageData = async (storageAddress: string) => {
      setIsLoading(true)

      try {
        let storageSettings = defaultStorageSettings()
        const tokenLists: TokenList[] = []

        // get address code on network switching and don't do anything
        // if we get '0x' code (means we still haven't had the valid storage address)
        const code = await library?.getCode(storageAddress)

        if (code === '0x') return

        const storage = new Contract(storageAddress, STORAGE.abi, library)

        if (!storage) return

        const settings = await storage.settings()
        storageSettings = parseSettings(settings || '{}')

        if (data?.addressesOfTokenLists?.length) {
          data?.addressesOfTokenLists.forEach((url: string) => dispatch(addList(url)))
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
          console.group('%c Custom token lists', 'color: red')
          console.error(error)
          console.groupEnd()
          setError(error)
        }

        setData({ ...registryData, ...storageSettings, tokenLists })
      } catch (error) {
        console.group('%c Storage data', 'color: red;')
        console.error(error)
        console.groupEnd()
        setError(error)
        setIsLoading(false)
        setData(registryData)
      }

      setIsLoading(false)
    }

    const fetchNecessaryData = async () => {
      if (!registry) return setData(null)

      setError(null)
      setIsLoading(true)

      try {
        let fullData = null
        const currentDomain = window.location.hostname || document.location.host
        const data = await registry.domain(currentDomain)
        const { admin, factory, router, storageAddr } = data
        const registredDomain = admin !== ZERO_ADDRESS && factory !== ZERO_ADDRESS && router !== ZERO_ADDRESS

        if (!registredDomain) return setData(null)

        //@ts-ignore
        const factoryContract = getContractInstance(library, factory, FACTORY.abi)
        const factoryInfo = await factoryContract.methods.allInfo().call()
        const {
          protocolFee,
          feeTo,
          totalFee,
          allFeeToProtocol,
          POSSIBLE_PROTOCOL_PERCENT,
          totalSwaps,
          INIT_CODE_PAIR_HASH,
        } = factoryInfo

        fullData = {
          //@ts-ignore
          admin,
          factory,
          router,
          storage: storageAddr,
          protocolFee,
          feeRecipient: feeTo,
          totalFee,
          pairHash: INIT_CODE_PAIR_HASH,
          allFeeToProtocol,
          possibleProtocolPercent: POSSIBLE_PROTOCOL_PERCENT,
          totalSwaps: totalSwaps || '',
        }

        setRegistryData(fullData)
      } catch (error) {
        console.group('%c Domain data', 'color: red;')
        console.error(error)
        console.groupEnd()
        setError(error)
        // finish loading only on necessary data error (if it's ok, we load storage data)
        setIsLoading(false)
      }

      if (registryData?.storage) {
        fetchStorageData(registryData.storage)
      } else {
        setData(registryData)
        setIsLoading(false)
      }
    }

    fetchNecessaryData()
  }, [registry, trigger, library, chainId])

  return { data, isLoading, error }
}
