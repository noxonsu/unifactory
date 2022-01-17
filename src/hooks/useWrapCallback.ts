import { Currency, currencyEquals } from 'sdk'
import { useMemo } from 'react'
import { useBaseCurrency } from 'hooks/useCurrency'
import { useWrappedToken } from 'hooks/useToken'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useActiveWeb3React } from './index'
import { useWETHContract } from './useContract'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined,
  outputCurrency: Currency | undefined,
  typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { chainId, account } = useActiveWeb3React()
  const baseCurrency = useBaseCurrency()
  const wethContract = useWETHContract()
  const wrappedToken = useWrappedToken()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(
    () => tryParseAmount(baseCurrency, typedValue, inputCurrency),
    [inputCurrency, typedValue]
  )
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (inputCurrency === baseCurrency && wrappedToken && currencyEquals(wrappedToken, outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await wethContract.deposit({ value: `0x${inputAmount.raw.toString(16)}` })
                  addTransaction(txReceipt, {
                    summary: `Wrap ${inputAmount.toSignificant(6)} ${baseCurrency.name} to ${wrappedToken?.name}`,
                  })
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : `Insufficient ${baseCurrency.name} balance`,
      }
    } else if (wrappedToken && currencyEquals(wrappedToken, inputCurrency) && outputCurrency === baseCurrency) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.raw.toString(16)}`)
                  addTransaction(txReceipt, {
                    summary: `Unwrap ${inputAmount.toSignificant(6)} ${wrappedToken?.name} to ${baseCurrency.name}`,
                  })
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: sufficientBalance ? undefined : 'Insufficient token balance',
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [wethContract, wrappedToken, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction])
}
