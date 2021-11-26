import { Alert, Accordion } from 'react-bootstrap'
import { TokenList } from './TokenList'

export function TokenLists(props) {
  const { tokenLists } = props

  return (
    <section>
      {tokenLists?.length ? (
        <Accordion>
          {tokenLists.map((list, index) => {
            return (
              <Accordion.Item eventKey={index}>
                <Accordion.Body>
                  <TokenList list={list} />
                </Accordion.Body>
              </Accordion.Item>
            )
          })}
        </Accordion>
      ) : (
        <Alert variant="secondary">No token list</Alert>
      )}
    </section>
  )
}
