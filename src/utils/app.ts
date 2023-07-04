import { ZERO_ADDRESS, ZERO_HASH } from '../sdk/constants'
import FACTORY from 'contracts/build/Factory.json'
import { StorageState } from 'state/application/reducer'
import { getContractInstance } from 'utils/contract'
import { isValidColor } from 'utils/color'
import { filterTokenLists } from 'utils/list'
import { getWordpressData } from './wordpress'
import onout from 'shared/services/onout'
import { Addition, paidAdditions } from '../constants/onout'
import { STORAGE_APP_KEY } from '../constants'

export const getCurrentDomain = (): string => {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEV_DOMAIN) {
    return process.env.REACT_APP_DEV_DOMAIN
  }
  return window.location.hostname || document.location.host || ''
}

const validArray = (arr: unknown[]) => Array.isArray(arr) && !!arr.length

const defaultSettings = (): StorageState => ({
  admin: '',
  contracts: {},
  factory: '',
  router: '',
  pairHash: '',
  feeRecipient: '',
  protocolFee: undefined,
  totalFee: undefined,
  allFeeToProtocol: undefined,
  possibleProtocolPercent: [],
  totalSwaps: undefined,
  domain: '',
  projectName: '',
  brandColor: '',
  backgroundColorDark: '',
  backgroundColorLight: '',
  textColorDark: '',
  textColorLight: '',
  logo: '',
  favicon: '',
  background: '',
  tokenListsByChain: {},
  tokenLists: [],
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
  disableSourceCopyright: false,
  defaultSwapCurrency: { input: '', output: '' },
  onoutFeeTo: '',
  additions: {},
})

const parseSettings = (settings: string, chainId: number, owner: string, wpVersion: boolean = false): StorageState => {
  const appSettings = defaultSettings()

  try {
    const settingsJSON = JSON.parse(settings)

    if (!settingsJSON?.[STORAGE_APP_KEY]) {
      settingsJSON[STORAGE_APP_KEY] = {}
    }
    if (!settingsJSON[STORAGE_APP_KEY]?.contracts) {
      settingsJSON[STORAGE_APP_KEY].contracts = {}
    }
    if (!settingsJSON[STORAGE_APP_KEY]?.contracts) {
      settingsJSON[STORAGE_APP_KEY].tokenLists = {}
    }

    const { definance: parsedSettings } = settingsJSON

    const {
      contracts,
      pairHash,
      feeRecipient,
      domain,
      projectName,
      brandColor,
      backgroundColorDark,
      backgroundColorLight,
      textColorDark,
      textColorLight,
      logoUrl,
      faviconUrl,
      backgroundUrl,
      navigationLinks,
      menuLinks,
      socialLinks,
      tokenLists,
      addressesOfTokenLists,
      disableSourceCopyright,
      defaultSwapCurrency,
      additions,
    } = parsedSettings

    appSettings.contracts = contracts

    if (contracts[chainId]) {
      const { factory, router } = contracts[chainId]

      appSettings.factory = factory
      appSettings.router = router
    }

    if (pairHash !== ZERO_HASH) appSettings.pairHash = pairHash
    if (feeRecipient !== ZERO_ADDRESS) appSettings.feeRecipient = feeRecipient
    if (domain) appSettings.domain = domain
    if (projectName) appSettings.projectName = projectName

    if (isValidColor(brandColor)) appSettings.brandColor = brandColor
    if (isValidColor(backgroundColorDark)) appSettings.backgroundColorDark = backgroundColorDark
    if (isValidColor(backgroundColorLight)) appSettings.backgroundColorLight = backgroundColorLight
    if (isValidColor(textColorDark)) appSettings.textColorDark = textColorDark
    if (isValidColor(textColorLight)) appSettings.textColorLight = textColorLight

    if (backgroundUrl) appSettings.background = backgroundUrl
    if (logoUrl) appSettings.logo = logoUrl
    if (faviconUrl) appSettings.favicon = faviconUrl
    if (disableSourceCopyright) appSettings.disableSourceCopyright = disableSourceCopyright

    if (validArray(navigationLinks)) appSettings.navigationLinks = navigationLinks
    if (validArray(menuLinks)) appSettings.menuLinks = menuLinks
    if (validArray(socialLinks)) appSettings.socialLinks = socialLinks
    if (validArray(addressesOfTokenLists)) appSettings.addressesOfTokenLists = addressesOfTokenLists

    if (tokenLists && Object.keys(tokenLists).length) {
      appSettings.tokenListsByChain = tokenLists

      if (tokenLists[chainId]) {
        appSettings.tokenLists = filterTokenLists(chainId, tokenLists[chainId])
      }
    }

    if (defaultSwapCurrency) {
      const { input, output } = defaultSwapCurrency

      if (input) appSettings.defaultSwapCurrency.input = input
      if (output) appSettings.defaultSwapCurrency.output = output
    }

    if (wpVersion) {
      appSettings.additions = Object.values(paidAdditions).reduce(
        (adds, { id }: { id: Addition }) => ({
          ...adds,
          [id]: {
            key: onout.generateAdditionKey({ addition: id, account: owner }),
            isValid: true,
          },
        }),
        {}
      )
    } else if (additions) {
      // Update format of the object from the Storage and check if each addition has a valid key.
      appSettings.additions = Object.keys(additions).reduce((adds, additionKey) => {
        const key = onout.generateAdditionKey({ addition: additionKey as unknown as Addition, account: owner })

        return {
          ...adds,
          [additionKey]: {
            key: additions[additionKey],
            isValid: additions[additionKey] === key,
          },
        }
      }, {})
    }
  } catch (error) {
    console.group('%c Storage settings', 'color: red')
    console.log('source settings: ', settings)
    console.error(error)
    console.groupEnd()
  }

  return appSettings
}

export const fetchDomainData = async ({
  chainId,
  library,
  storage,
}: {
  chainId: undefined | number
  library: unknown
  storage: any
  trigger?: boolean
}): Promise<StorageState | null> => {
  let fullData = defaultSettings()

  try {
    let currentDomain = getCurrentDomain()

    if (currentDomain === 'eeecex.net') {
      currentDomain = 'eeecEx.net'
    }

    const { info, owner } = await storage.methods.getData(currentDomain).call()
    const { wpVersion } = getWordpressData()

    const settings = parseSettings(info || '{}', chainId || 0, owner, wpVersion)
    const { factory } = settings

    fullData = { ...settings, admin: owner === ZERO_ADDRESS ? '' : owner }

    if (factory) {
      try {
        //@ts-ignore
        const factoryContract = getContractInstance(library.provider, factory, FACTORY.abi)
        const factoryInfo = await factoryContract.methods.allInfo().call()

        const {
          protocolFee,
          feeTo,
          totalFee,
          allFeeToProtocol,
          totalSwaps,
          POSSIBLE_PROTOCOL_PERCENT,
          INIT_CODE_PAIR_HASH,
          OnoutFeeTo,
        } = factoryInfo

        return {
          ...fullData,
          pairHash: INIT_CODE_PAIR_HASH,
          protocolFee,
          feeRecipient: feeTo,
          totalFee,
          allFeeToProtocol,
          onoutFeeTo: OnoutFeeTo,
          possibleProtocolPercent: validArray(POSSIBLE_PROTOCOL_PERCENT) ? POSSIBLE_PROTOCOL_PERCENT.map(Number) : [],
          totalSwaps: totalSwaps || undefined,
        }
      } catch (error) {
        console.group('%c Factory info', 'color: red;')
        console.error(error)
        console.groupEnd()
      }
    }

    return fullData
  } catch (error) {
    console.group('%c Domain data request', 'color: red;')
    console.error(error)
    console.groupEnd()
    return null
  }
}
