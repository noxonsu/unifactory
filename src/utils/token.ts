import { Web3Provider } from '@ethersproject/providers'
import TokenAbi from 'human-standard-token-abi'
import { Currency, TokenAmount, ETHER } from 'sdk'
import { getWeb3Library } from './getLibrary'

export async function getBalance(params: {
  account?: string | undefined
  currency: Currency
  library?: Web3Provider | undefined
}): Promise<TokenAmount | undefined> {
  const { account, currency, library } = params

  if (!account || !library) return undefined

  try {
    const web3 = getWeb3Library(library.provider)
    let unitBalance: string

    if (currency === ETHER) {
      unitBalance = await web3.eth.getBalance(account)
    } else {
      //@ts-ignore
      const contract = new web3.eth.Contract(TokenAbi, currency?.address || '')
      unitBalance = await contract.methods.balanceOf(account).call()
    }

    //@ts-ignore
    return new TokenAmount(currency, unitBalance)
  } catch (error) {
    console.error(error)
    return undefined
  }
}
