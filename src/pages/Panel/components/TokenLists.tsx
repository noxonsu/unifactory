import React from 'react'
import { useActiveWeb3React } from 'hooks'
import { TokenList } from './TokenList'
import { useTranslation } from 'react-i18next'

export function TokenLists(props: any) {
  const { tokenLists, storage, pending, setPending, setError, setNotification } = props
  const { t } = useTranslation()
  const web3React = useActiveWeb3React()

  return (
    <section>
      {tokenLists?.length ? (
        <>
          {tokenLists.map((list: any, index: number) => {
            const { name } = list

            return (
              <div key={index}>
                <h4>{name}</h4>

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
              </div>
            )
          })}
        </>
      ) : (
        <p>{t('noTokenLists')}</p>
      )}
    </section>
  )
}
