import { useEffect, useState } from 'react'

type Data = null | {
  wpAdmin?: string
  wpNetworkId?: number
}

export default function useWordpressInfo(): Data {
  const [data, setData] = useState<Data>(null)

  const updateWithNewValue = (key: string, value: any) =>
    setData((prevState) => (prevState ? { ...prevState, [key]: value } : { [key]: value }))

  useEffect(() => {
    if (window.wp_unifactory_admin) {
      updateWithNewValue('wpAdmin', window.wp_unifactory_admin)
    }

    if (window.wp_unifactory_chainId) {
      updateWithNewValue('wpNetworkId', window.wp_unifactory_chainId)
    }
  }, [])

  return data
}
