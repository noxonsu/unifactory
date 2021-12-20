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
  const { tokenLists, storage, pending, setPending, setError, setNotification } = props
  const { t } = useTranslation()
  const web3React = useActiveWeb3React()

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
                setNotification={setNotification}
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
