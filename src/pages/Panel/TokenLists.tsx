import React, { useEffect, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { TokenList } from './TokenList'
import { useTranslation } from 'react-i18next'
import networks from 'networks.json'

const ListWrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: 0.2rem;
  }
`

export function TokenLists(props: any) {
  const { tokenLists, pending, setPending } = props
  const { t } = useTranslation()
  const activeWeb3React = useActiveWeb3React()

  const [chainIds, setChainIds] = useState(Object.keys(tokenLists))

  useEffect(() => setChainIds(Object.keys(tokenLists)), [tokenLists])

  return (
    <section>
      {chainIds.length ? (
        chainIds.map((chainId: number | string) => (
          <div key={chainId}>
            <h3>{networks[chainId as keyof typeof networks].name || chainId}</h3>

            {Object.keys(tokenLists[chainId]).map((listId: string) => {
              const list = tokenLists[chainId][listId]

              return (
                <ListWrapper key={listId}>
                  <TokenList
                    activeWeb3React={activeWeb3React}
                    listChainId={String(chainId)}
                    listId={listId}
                    list={list}
                    pending={pending}
                    setPending={setPending}
                    isNewList={!list.timestamp}
                  />
                </ListWrapper>
              )
            })}
          </div>
        ))
      ) : (
        <p>{t('noTokenLists')}</p>
      )}
    </section>
  )
}
