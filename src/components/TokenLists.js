import { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Alert, Accordion } from 'react-bootstrap'
import { TokenList } from './TokenList'

export function TokenLists(props) {
  const {
    tokenLists,
    setTokenLists,
    pending,
    setPending,
    setError,
    setNotification,
  } = props
  const web3React = useWeb3React()

  /* 
  update list name
  update/remove/add tokens (only by addresses)

  other info will be auto calculated
  */

  return (
    <section>
      {tokenLists?.length ? (
        <Accordion>
          {tokenLists.map((list, index) => {
            const { name, tokens } = list

            return (
              <Accordion.Item
                className={index === tokenLists.length - 1 ? 'mb-3' : ''}
                eventKey={index}
                key={index}
              >
                <Accordion.Header>{name}</Accordion.Header>
                <Accordion.Body>
                  <TokenList
                    web3React={web3React}
                    // tokensLoading={tokensLoading}
                    tokens={tokens}
                    // setTokens={setTokens}
                    pending={pending}
                    setPending={setPending}
                    setError={setError}
                    setNotification={setNotification}
                  />
                </Accordion.Body>
              </Accordion.Item>
            )
          })}
        </Accordion>
      ) : (
        <Alert variant="warning">No token list</Alert>
      )}
    </section>
  )
}
