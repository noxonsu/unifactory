import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { AiOutlinePlus } from 'react-icons/ai'
import { GrFormClose } from 'react-icons/gr'
import { InputGroup, Alert, ListGroup, FormControl } from 'react-bootstrap'
import { Button } from './Button'
import { returnTokenInfo } from '../utils'

export function TokenList(props) {
  const { tokens, setTokens, pending, setPending, setError } = props
  const web3React = useWeb3React()
  const [newTokenAddress, setNewTokenAddress] = useState('')

  const updateTokenAddress = (event) => setNewTokenAddress(event.target.value)

  const addNewToken = async () => {
    const tokenInList = tokens.find(
      (item) => item.address.toLowerCase() === newTokenAddress.toLowerCase()
    )

    if (tokenInList) return

    setError(false)
    setPending(true)

    const tokenInfo = await returnTokenInfo(web3React.library, newTokenAddress)

    if (tokenInfo) {
      const { name, symbol, decimals } = tokenInfo

      setTokens((oldTokens) => [
        ...oldTokens,
        {
          name,
          symbol,
          decimals,
          address: newTokenAddress,
        },
      ])

      setNewTokenAddress('')
    } else {
      setError(
        new Error(
          'Seems it is not a token or an address from a different network. Double check it'
        )
      )
    }

    setPending(false)
  }

  const removeToken = (address) => {
    const updatedList = tokens.filter(
      (item) => item.address.toLowerCase() !== address.toLowerCase()
    )

    setTokens(updatedList)
  }

  return (
    <section className="mb-3 d-grid">
      {tokens.length ? (
        <ListGroup
          className={`mb-3 ${tokens.length > 8 ? 'scrollableList' : ''}`}
        >
          {tokens.map((item, index) => {
            const { name, symbol, address, decimals } = item

            return (
              <ListGroup.Item
                key={index}
                variant="light d-flex justify-content-between flex-wrap"
              >
                <span>
                  {name} <small className="text-muted">{decimals}</small>:
                </span>{' '}
                {address}
                <Button onClick={() => removeToken(address)}>
                  <GrFormClose title="remove token" />
                </Button>
              </ListGroup.Item>
            )
          })}
        </ListGroup>
      ) : (
        <Alert variant="secondary">No tokens</Alert>
      )}

      <InputGroup className="mb-3">
        <FormControl
          type="text"
          placeholder="Token address"
          defaultValue={newTokenAddress}
          onChange={updateTokenAddress}
        />
        <Button
          onClick={addNewToken}
          pending={pending}
          disabled={!newTokenAddress}
        >
          <AiOutlinePlus /> Token
        </Button>
      </InputGroup>
    </section>
  )
}
