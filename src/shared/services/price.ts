import { originUrl } from '../../constants/onout'

// const coingeckoApi = 'https://api.coingecko.com/api/v3'

const getOriginPrice = async ({ symbol, vsCurrency }: { symbol: string; vsCurrency: string }): Promise<number | void> => {
  try {
    const data = await fetch(`${originUrl}/cursAll.php?fiat=${vsCurrency}&tokens=${symbol}`).then((res) => res.json())
    const currencyData = data?.data?.find?.((currencyData: { symbol?: string }) => currencyData?.symbol === symbol)

    return currencyData.quote[vsCurrency].price
  } catch (error) {
    console.group('%c Get price', 'color: red;')
    console.error(error)
    console.groupEnd()
  }
}

const fetchCryptoPrice = (): void => {
  return
}

const fetchPriceInCrypto = (): void => {
  return
}

export default {
  fetchCryptoPrice,
  fetchPriceInCrypto,
}
