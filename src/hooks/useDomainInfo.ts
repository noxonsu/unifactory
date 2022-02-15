import { useEffect, useState } from 'react'
import { ZERO_ADDRESS } from 'sdk'
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
  feeRecipient: string
  protocolFee?: number
  totalFee?: number
  allFeeToProtocol?: boolean
  possibleProtocolPercent?: string[]
  totalSwaps: string
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
  const [isLoading, setIsLoading] = useState(true)
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
        const { admin, factory, router } = data
        const registredDomain = admin !== ZERO_ADDRESS && factory !== ZERO_ADDRESS && router !== ZERO_ADDRESS

        if (!registredDomain) return setData(null)

        fullData = { ...data }
        //@ts-ignore
        const factoryContract = getContractInstance(library, factory, FACTORY.abi)
        const INIT_CODE_PAIR_HASH = await factoryContract.methods.INIT_CODE_PAIR_HASH().call()

        fullData = { ...fullData, pairHash: INIT_CODE_PAIR_HASH }

        try {
          const factoryInfo = await factoryContract.methods.allInfo().call()
          const { protocolFee, feeTo, totalFee, allFeeToProtocol, POSSIBLE_PROTOCOL_PERCENT, totalSwaps } = factoryInfo

          fullData = {
            ...fullData,
            protocolFee,
            feeRecipient: feeTo,
            totalFee,
            allFeeToProtocol,
            possibleProtocolPercent: POSSIBLE_PROTOCOL_PERCENT,
            totalSwaps: totalSwaps || '',
          }
        } catch (error) {
          if (error.message.match(/\.allInfo is not a function/)) {
            console.group('%c Factory', 'color: orange;')
            console.log('not the latest version of the contract')
            console.groupEnd()
          } else {
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
  }, [registry, trigger, library, chainId])

  return { data, isLoading, error }
}
