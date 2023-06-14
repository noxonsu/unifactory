import { toChecksumAddress } from 'web3-utils'
import { Token } from 'sdk'
import { Tags, TokenInfo, TokenList } from '@uniswap/token-lists'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '../index'
import { sortByListPriority } from 'utils/list'
import { useAppState } from 'state/application/hooks'

type TagDetails = Tags[keyof Tags]
export interface TagInfo extends TagDetails {
  id: string
}

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo
  public readonly tags: TagInfo[]
  constructor(tokenInfo: TokenInfo, tags: TagInfo[]) {
    super(tokenInfo.chainId, toChecksumAddress(tokenInfo.address), tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
    this.tags = tags
  }
  public get logoURI(): string | undefined {
    return this.tokenInfo.logoURI
  }
}

export type TokenAddressMap = Readonly<{
  [chainId: number]: Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list: TokenList } }>
}>

const listCache: WeakMap<TokenList, TokenAddressMap> | null =
  typeof WeakMap !== 'undefined' ? new WeakMap<TokenList, TokenAddressMap>() : null

export function listToTokenMap(list: TokenList): TokenAddressMap {
  const result = listCache?.get(list)
  if (result) return result

  const map = list.tokens.reduce<TokenAddressMap>(
    (tokenMap, tokenInfo) => {
      const tags: TagInfo[] =
        tokenInfo.tags
          ?.map((tagId) => {
            if (!list.tags?.[tagId]) return undefined
            return { ...list.tags[tagId], id: tagId }
          })
          ?.filter((x): x is TagInfo => Boolean(x)) ?? []

      const token = new WrappedTokenInfo(tokenInfo, tags)

      if (tokenMap[token.chainId]?.[token.address] !== undefined) {
        console.group('%c Duplicate tokens', 'background: brown; color: yellow;')
        console.log('Chain ID', token.chainId)
        console.log('Token', token.address)
        console.groupEnd()

        return tokenMap
      }

      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: {
            token,
            list: list,
          },
        },
      }
    },
    { [-1]: {} }
  )
  listCache?.set(list, map)
  return map
}

export function useAllLists(): {
  readonly [url: string]: {
    readonly current: TokenList | null
    readonly pendingUpdate: TokenList | null
    readonly loadingRequestId: string | null
    readonly error: string | null
  }
} {
  return useSelector<AppState, AppState['lists']['byUrl']>((state) => state.lists.byUrl)
}

function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap, chainId: number): TokenAddressMap {
  return {
    [chainId]: { ...map1[chainId], ...map2[chainId] },
  }
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined, chainId: number): TokenAddressMap {
  const lists = useAllLists()
  const { tokenLists } = useAppState()

  return useMemo(() => {
    if (!urls) return { [chainId]: {} }

    const sourceTokens = urls
      .slice()
      // sort by priority so top priority goes last
      .sort(sortByListPriority)
      .reduce(
        (allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens

          try {
            const newTokens = Object.assign(listToTokenMap(current))
            return combineMaps(allTokens, newTokens, chainId)
          } catch (error) {
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        },
        { [chainId]: {} }
      )

    let customTokens = {}

    if (tokenLists.length) {
      customTokens = tokenLists.reduce(
        (allTokens, list) => {
          const newTokens = Object.assign(listToTokenMap(list))
          return combineMaps(allTokens, newTokens, chainId)
        },
        { [chainId]: {} }
      )
    }
    return combineMaps(sourceTokens, customTokens, chainId)
  }, [lists, urls, chainId, tokenLists])
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  return useSelector<AppState, AppState['lists']['activeListUrls']>((state) => state.lists.activeListUrls)
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()

  return Object.keys(lists).filter((url) => !allActiveListUrls?.includes(url))
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(chainId: number): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls, chainId)

  return activeTokens
}

// all tokens from inactive lists
export function useCombinedInactiveList(chainId: number): TokenAddressMap {
  const allInactiveListUrls: string[] = useInactiveListUrls()

  return useCombinedTokenMapFromUrls(allInactiveListUrls, chainId)
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()

  return Boolean(activeListUrls?.includes(url))
}
