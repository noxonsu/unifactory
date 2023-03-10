import { originUrl } from '../../constants/onout'

const MAX_PERCENT = 100
const USD_TICKET = 'USD'

const fetchCryptoPrice = async ({
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

const calculateCryptoAmount = ({ fiatAmount, cryptoPrice }: { fiatAmount: number; cryptoPrice: number }) => {
  return fiatAmount / (cryptoPrice / MAX_PERCENT) / MAX_PERCENT
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
  const cryptoPrice = await fetchCryptoPrice({ symbol, fiatTicket })

  if (cryptoPrice)
    return calculateCryptoAmount({
      fiatAmount,
      cryptoPrice,
    })
}

export default {
  fetchCryptoPrice,
  fetchPriceInCrypto,
  calculateCryptoAmount,
}
