import isNumber from 'is-number'

type Data = {
  wpAdmin?: string
  wpNetworkIds?: number[]
  wpVersion?: boolean
}

const wpData: Data = {}

export const getWordpressData = (): Data => {
  if (window.SO_Definance) {
    const { SO_Definance } = window

    if (SO_Definance?.masterAddress) {
      wpData.wpAdmin = SO_Definance.masterAddress
    }
    if (Array.isArray(SO_Definance?.chainIds) && SO_Definance?.chainIds.length) {
      type ExternalId = string | number
      const validatedIds = SO_Definance.chainIds.filter((id: ExternalId) => isNumber(id))

      if (validatedIds.length) {
        wpData.wpNetworkIds = validatedIds.map((id: ExternalId) => Number(id))
      }
    }
    if (SO_Definance?.wpVersion !== undefined) {
      wpData.wpVersion = SO_Definance.wpVersion
    }
  }

  return wpData
}
