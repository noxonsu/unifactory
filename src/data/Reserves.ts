import { TokenAmount, Pair, Currency } from 'sdk'
import { useMemo } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Interface } from '@ethersproject/abi'
import { useActiveWeb3React } from 'hooks'
import { useWrappedToken } from 'hooks/useToken'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { useBaseCurrency } from 'hooks/useCurrency'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useProjectInfo } from 'state/application/hooks'

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI)

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId } = useActiveWeb3React()
  const { factory, pairHash } = useProjectInfo()
  const baseCurrency = useBaseCurrency()
  const wrappedToken = useWrappedToken()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId, wrappedToken, baseCurrency),
        wrappedCurrency(currencyB, chainId, wrappedToken, baseCurrency),
      ]),
    [chainId, currencies, wrappedToken, baseCurrency]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB)
          ? Pair.getAddress(tokenA, tokenB, factory, pairHash)
          : undefined
      }),
    [tokens, factory, pairHash]
  )
  // computePairAddress
  const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves')

  console.groupEnd()

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result
      const tokenA = tokens[i][0]
      const tokenB = tokens[i][1]

      if (loading) return [PairState.LOADING, null]
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      if (!reserves) return [PairState.NOT_EXISTS, null]
      const { reserve0, reserve1 } = reserves
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return [
        PairState.EXISTS,
        new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString()),
          factory,
          pairHash
        ),
      ]
    })
  }, [results, tokens, factory, pairHash])
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}
