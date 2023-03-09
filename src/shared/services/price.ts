import { originUrl } from '../../constants/onout'

const MAX_PERCENT = 100
const USD_TICKET = 'USD'

const getOriginPrice = async ({
  symbol,
  fiatTicket = USD_TICKET,
}: {
  symbol: string
  fiatTicket?: string
}): Promise<number | void> => {
  try {
    const data = await fetch(`${originUrl}/cursAll.php?fiat=${fiatTicket}&tokens=${symbol}`).then((res) => res.json())
    const currencyData = data?.data?.find?.((currencyData: { symbol?: string }) => currencyData?.symbol === symbol)

    return currencyData.quote[fiatTicket].price
  } catch (error) {
    console.group('%c Get price', 'color: red;')
    console.error(error)
    console.groupEnd()
  }
}

const fetchCryptoPrice = (): void => {
  return
}

const fetchPriceInCrypto = async ({
  fiatAmount,
  symbol,
  fiatTicket = USD_TICKET,
}: {
  fiatAmount: number
  symbol: string
  fiatTicket?: string
}): Promise<number | void> => {
  const cryptoPrice = await getOriginPrice({ symbol, fiatTicket })

  if (cryptoPrice) {
    const onePercentPrice = cryptoPrice / MAX_PERCENT
    const amountPercentageOfTotal = fiatAmount / onePercentPrice

    return amountPercentageOfTotal / MAX_PERCENT
  }
}

export default {
  fetchCryptoPrice,
  fetchPriceInCrypto,
}
