import React from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { TokenList } from './TokenList'
import { useTranslation } from 'react-i18next'
import { useAppState } from 'state/application/hooks'

const ListWrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: 0.2rem;
  }
`

export function TokenLists(props: any) {
  const { tokenLists, pending, setPending, setError } = props
  const { t } = useTranslation()
  const web3React = useActiveWeb3React()
  const { storage } = useAppState()

  return (
    <section>
      {tokenLists?.length ? (
        <>
          {tokenLists.map((list: any, index: number) => (
            <ListWrapper key={index}>
              <TokenList
                web3React={web3React}
                list={list}
                pending={pending}
                setPending={setPending}
                setError={setError}
                storage={storage}
                isNewList={!list.timestamp}
              />
            </ListWrapper>
          ))}
        </>
      ) : (
        <p>{t('noTokenLists')}</p>
      )}
    </section>
  )
}
