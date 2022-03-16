import { useEffect, useState } from 'react'
import FACTORY from 'contracts/build/Factory.json'
import { useStorageContract } from './useContract'
import { useActiveWeb3React } from 'hooks'
import { getContractInstance } from 'utils/contract'
import { STORAGE_NETWORK_ID } from '../constants'
import { StorageState } from '../state/application/reducer'
import networks from 'networks.json'

const defaultSettings = (): StorageState => ({
  admin: '',
  factory: '',
  router: '',
  pairHash: '',
  feeRecipient: '',
  protocolFee: undefined,
  totalFee: undefined,
  allFeeToProtocol: undefined,
  possibleProtocolPercent: [],
  totalSwaps: undefined,
  projectName: '',
  brandColor: '',
  backgroundColorDark: '',
  backgroundColorLight: '',
  textColorDark: '',
  textColorLight: '',
  logo: '',
  tokenLists: [],
  navigationLinks: [],
  menuLinks: [],
  socialLinks: [],
  addressesOfTokenLists: [],
  disableSourceCopyright: false,
})

const parseData = (jsonData: string) => {
  let appSettings = defaultSettings()

  try {
    appSettings = { ...appSettings, ...JSON.parse(jsonData) }
  } catch (error) {
    console.group('%c Storage data', 'color: red')
    console.error(error)
    console.log('source data: ', jsonData)
    console.groupEnd()
  }

  return appSettings
}

export default function useDomainInfo(trigger: boolean): {
  data: StorageState | null
  isLoading: boolean
  error: Error | null
} {
  const { library } = useActiveWeb3React()

  // @ts-ignore
  const { storage: storageAddress } = networks[STORAGE_NETWORK_ID]

  // @ts-ignore
  const storage = useStorageContract(storageAddress)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!storage) return setData(null)

      setError(null)
      setIsLoading(true)

      try {
        let fullData = null
        const currentDomain = window.location.hostname || document.location.host
        let { info } = await storage.methods.getData(currentDomain).call()

        let parsedInfo = parseData(info || '{}')

        fullData = { ...parsedInfo }

        const { factory } = parsedInfo

        if (factory) {
          //@ts-ignore
          const factoryContract = getContractInstance(library, factory, FACTORY.abi)
          const INIT_CODE_PAIR_HASH = await factoryContract.methods.INIT_CODE_PAIR_HASH().call()

          fullData = { ...parsedInfo, pairHash: INIT_CODE_PAIR_HASH }

          try {
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
              ...fullData,
              //@ts-ignore
              protocolFee,
              feeRecipient: feeTo,
              totalFee,
              allFeeToProtocol,
              pairHash: INIT_CODE_PAIR_HASH,
              possibleProtocolPercent: POSSIBLE_PROTOCOL_PERCENT,
              totalSwaps: totalSwaps || '',
            }
          } catch (error) {
            console.group('%c Factory info', 'color: red;')
            console.error(error)
            console.groupEnd()
          }
        }

        setData(fullData)
      } catch (error) {
        console.group('%c Domain data request', 'color: red;')
        console.error(error)
        console.groupEnd()
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [storage, trigger, library])

  return { data, isLoading, error }
}
