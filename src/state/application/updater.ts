import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveWeb3React } from 'hooks'
import { filterTokenLists } from 'utils/list'
import useDebounce from 'hooks/useDebounce'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useAppState } from './hooks'
import { updateBlockNumber, updateAppOptions } from './actions'

export default function Updater(): null {
  const { library, chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch()
  const { contracts, tokenListsByChain } = useAppState()
  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState((state) => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId, setState]
  )

  // attach/detach listeners

  useEffect(() => {
    if (chainId && contracts[chainId]) {
      const { factory, router } = contracts[chainId]

      dispatch(
        updateAppOptions([
          { key: 'factory', value: factory || '' },
          { key: 'router', value: router || '' },
        ])
      )
    } else {
      dispatch(
        updateAppOptions([
          { key: 'factory', value: '' },
          { key: 'router', value: '' },
        ])
      )
    }
  }, [chainId, contracts, dispatch])

  useEffect(() => {
    if (chainId && tokenListsByChain[chainId]) {
      const tokenLists = filterTokenLists(chainId, tokenListsByChain[chainId])

      dispatch(updateAppOptions([{ key: 'tokenLists', value: tokenLists }]))
    }
  }, [chainId, tokenListsByChain, dispatch])

  useEffect(() => {
    if (!library || !chainId || !account || !windowVisible) return undefined

    setState({ chainId, blockNumber: null })

    library
      .getBlockNumber()
      .then(blockNumberCallback)
      .catch((error) => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    library.on('block', blockNumberCallback)
    return () => {
      library.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, account, library, blockNumberCallback, windowVisible])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId])

  return null
}
