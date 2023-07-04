import React from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { TokenList } from './TokenList'
import { useTranslation } from 'react-i18next'

const ListWrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: 0.2rem;
  }
`

export function TokenLists(props: any) {
  const { tokenLists, pending, setPending, deleteTokenList, switchToNetwork } = props
  const { t } = useTranslation()
  const activeWeb3React = useActiveWeb3React()
  const chainIds = Object.keys(tokenLists)

  return (
    <section>
      {chainIds.length ? (
        chainIds.map((chainId: number | string) => (
          <ListWrapper key={chainId}>
            {Object.keys(tokenLists[chainId]).map((listId: string) => {
              const list = tokenLists[chainId][listId]

              return (
                <TokenList
                  key={listId}
                  activeWeb3React={activeWeb3React}
                  listChainId={String(chainId)}
                  listId={listId}
                  list={list}
                  pending={pending}
                  setPending={setPending}
                  isNewList={!list.timestamp}
                  deleteTokenList={deleteTokenList}
                  switchToNetwork={switchToNetwork}
                />
              )
            })}
          </ListWrapper>
        ))
      ) : (
        <p>{t('noTokenLists')}</p>
      )}
    </section>
  )
}
