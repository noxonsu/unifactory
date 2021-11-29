import { useState, useEffect } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { InputGroup, Alert, ListGroup, FormControl } from 'react-bootstrap'
import { Button } from './Button'
import { returnTokenInfo, isValidAddress } from '../utils'

export function TokenList(props) {
  const {
    tokens,
    web3React,
    // setTokens, tokensLoading,
    pending,
    setPending,
    setError,
  } = props
  const [newTokenAddress, setNewTokenAddress] = useState('')
  const [tokenAddressIsCorrect, setTokenAddressIsCorrect] = useState(true)

  const updateTokenAddress = (event) => setNewTokenAddress(event.target.value)

  useEffect(() => {
    if (web3React.library) {
      setTokenAddressIsCorrect(
        isValidAddress(web3React.library, newTokenAddress)
      )
    }
  }, [web3React.library, newTokenAddress])

  const addNewToken = async () => {
    return

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
          // chainId,
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
    return

    const updatedList = tokens.filter(
      (item) => item.address.toLowerCase() !== address.toLowerCase()
    )

    setTokens(updatedList)
  }

  return (
    <section className="mb-3 d-grid">
      {tokens.length ? (
        <>
          <ListGroup
            className={`mb-2 ${tokens.length > 7 ? 'scrollableList' : ''}`}
          >
            {tokens.map((item, index) => {
              const { name, symbol, address } = item

              return (
                <ListGroup.Item
                  key={index}
                  className="d-flex justify-content-between align-items-center flex-wrap"
                >
                  <span>
                    {name} <small className="text-muted">({symbol})</small>:
                  </span>
                  <span className="d-flex align-items-center">
                    <span className="me-2">{address}</span>
                    <button
                      type="button"
                      className="btn-close btn-sm"
                      aria-label="Close"
                      title="remove this token"
                      onClick={() => removeToken(address)}
                    ></button>
                  </span>
                </ListGroup.Item>
              )
            })}
          </ListGroup>

          {/* {tokensLoading && (
            <span className="mb-3 d-flex justify-content-center">
              Loading...
            </span>
          )} */}
        </>
      ) : (
        <Alert variant="warning">No tokens</Alert>
      )}

      <InputGroup className="mb-3">
        <FormControl
          type="text"
          placeholder="Token address"
          defaultValue={newTokenAddress}
          onChange={updateTokenAddress}
          className={`${
            newTokenAddress && !tokenAddressIsCorrect ? 'wrong' : ''
          }`}
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
