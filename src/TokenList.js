import { useState, useEffect } from 'react'
import {
  Button,
  InputGroup,
  FormControl,
  Row,
  Col,
  Alert,
  ListGroup,
} from 'react-bootstrap'
import { getData } from './utils'

export function TokenList(props) {
  const [pending, setPending] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [tokensDataHash, setTokensDataHash] = useState('')
  const [tokensData, setTokensData] = useState([])

  const updatePublicKey = (event) => setPublicKey(event.target.value)
  const updatePrivateKey = (event) => setPrivateKey(event.target.value)
  const updateListHash = (event) => setTokensDataHash(event.target.value)

  const loadTokenList = async () => {
    setPending(true)

    if (tokensDataHash) {
      try {
        const tokensData = await getData(tokensDataHash)

        if (tokensData) {
          setTokensData(tokensData)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    }
  }

  return (
    <section>
      <Row className="mb-3">
        <Col className="d-grid">
          <InputGroup className="mb-2">
            <FormControl
              onChange={updatePublicKey}
              placeholder="Pinata public key"
            />
          </InputGroup>
        </Col>
        <Col className="d-grid">
          <InputGroup className="mb-2">
            <FormControl
              onChange={updatePrivateKey}
              placeholder="Pinata private key"
            />
          </InputGroup>
        </Col>
      </Row>

      <InputGroup className="mb-3" disabled={pending}>
        <FormControl
          placeholder="Token list hash"
          aria-label="Token list hash"
          onChange={updateListHash}
        />
        <Button
          variant="primary"
          onClick={loadTokenList}
          disabled={!tokensDataHash || pending}
        >
          {pending ? 'Pending...' : 'Load a token list'}
        </Button>
      </InputGroup>

      {tokensData?.tokens?.length ? (
        <ListGroup>
          {tokensData.tokens.map((item, index) => {
            const { name, address } = item

            return (
              <ListGroup.Item key={index} variant="light">
                <b>{name}</b>: {address}
              </ListGroup.Item>
            )
          })}
        </ListGroup>
      ) : (
        <Alert>No token list</Alert>
      )}
    </section>
  )
}
