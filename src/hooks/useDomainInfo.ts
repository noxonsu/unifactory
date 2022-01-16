import { useEffect, useState } from 'react'
import FACTORY from 'contracts/build/Factory.json'
import { useRegistryContract } from './useContract'
import { useActiveWeb3React } from 'hooks'
import { getContractInstance } from 'utils/contract'
import networks from 'networks.json'

type Data = {
  admin: string
  factory: string
  router: string
  storageAddr: string
  pairHash: string
  protocolFee?: number
  totalFee?: number
  allFeeToProtocol?: boolean
}

export default function useDomainInfo(trigger: boolean): {
  data: Data | null
  isLoading: boolean
  error: Error | null
} {
  const { chainId, library } = useActiveWeb3React()
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
        let fullData = null
        const currentDomain = window.location.hostname || document.location.host
        const data = await registry.domain(currentDomain)

        fullData = { ...data }
        //@ts-ignore
        const factory = getContractInstance(library, data.factory, FACTORY.abi)
        const INIT_CODE_PAIR_HASH = await factory.methods.INIT_CODE_PAIR_HASH().call()

        fullData = { ...fullData, pairHash: INIT_CODE_PAIR_HASH }

        try {
          // in the updated contract verion we can extract all data at the same time
          // if there is no such method, then this is not a critical problem
          const factoryInfo = await factory.methods.allInfo().call()
          const { protocolFee, totalFee, allFeeToProtocol, POSSIBLE_PROTOCOL_PERCENT } = factoryInfo

          fullData = {
            ...fullData,
            protocolFee,
            totalFee,
            allFeeToProtocol,
            possibleProtocolPercent: POSSIBLE_PROTOCOL_PERCENT,
          }
        } catch (error) {
          if (error.message.match(/\.allInfo is not a function/)) {
            console.group('%c Factory', 'color: orange;')
            console.log('not the latest version of the contract')
            console.groupEnd()
          } else {
            console.error(error)
          }
        }

        setData(fullData)
      } catch (error) {
        console.error(error)
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [registry, trigger, library])

  return { data, isLoading, error }
}
