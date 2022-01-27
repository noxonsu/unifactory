import { useEffect, useState } from 'react'
import isNumber from 'is-number'

type Data = null | {
  wpAdmin?: string
  wpNetworkId?: number
}

export default function useWordpressInfo(): Data {
  const [data, setData] = useState<Data>(null)

  const updateWithNewValue = (key: string, value: any) =>
    setData((prevState) => (prevState ? { ...prevState, [key]: value } : { [key]: value }))

  useEffect(() => {
    if (window.SO_Definance) {
      // eslint-disable-next-line @typescript-eslint/camelcase
      const { SO_Definance } = window

      if (SO_Definance?.masterAddress) {
        // eslint-disable-next-line @typescript-eslint/camelcase
        updateWithNewValue('wpAdmin', SO_Definance.masterAddress)
      }
      if (isNumber(SO_Definance?.chainId)) {
        // eslint-disable-next-line @typescript-eslint/camelcase
        updateWithNewValue('wpNetworkId', Number(SO_Definance.chainId))
      }
    }
  }, [])

  return data
}
