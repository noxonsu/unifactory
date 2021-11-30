import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InputGroup, FormControl, Form } from 'react-bootstrap'
import { Button } from './Button'
import { isValidAddress, setFactoryOption } from '../utils'
import { factoryMethods } from '../constants'

export function SwapContracts(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [factory, setFactory] = useState(
    '0x84c9699f87EB31672BFBe0460CFb87643A97BD07'
  )
  const [factoryIsCorrect, setFactoryIsCorrect] = useState(false)

  useEffect(() => {
    if (web3React.library) {
      setFactoryIsCorrect(isValidAddress(web3React.library, factory))
    }
  }, [web3React.library, factory])

  const [admin, setAdmin] = useState('')
  const [feeRecipient, setFeeRecipient] = useState('')
  const [allFeesToAdmin, setAllFeesToAdmin] = useState(false)

  const updateFactory = (event) => setFactory(event.target.value)
  const updateAdmin = (event) => setAdmin(event.target.value)
  const updateFeeRecipient = (event) => setFeeRecipient(event.target.value)
  const updateFeesToAdmin = (event) => setAllFeesToAdmin(event.target.checked)

  const saveOption = async (method) => {
    let value

    switch (method) {
      case factoryMethods.setFeeToSetter:
        value = admin
        break
      case factoryMethods.setFeeTo:
        value = feeRecipient
        break
      case factoryMethods.setAllFeeToProtocol:
        value = allFeesToAdmin
        break
      default:
        value = ''
    }

    setPending(true)

    try {
      const receipt = await setFactoryOption(
        web3React.library,
        web3React.account,
        factory,
        method,
        value
      )

      console.log('receipt: ', receipt)
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <Form.Label htmlFor="factoryContractInput">Factory contract *</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="factoryContractInput"
          defaultValue={factory}
          onChange={updateFactory}
          className={`${factory && !factoryIsCorrect ? 'wrong' : ''}`}
        />
      </InputGroup>

      <p className="highlightedInfo info">
        You can use the same address for both inputs.
      </p>

      <div className={`${!factoryIsCorrect || pending ? 'disabled' : ''}`}>
        <Form.Label htmlFor="newAdminAddress">Admin address</Form.Label>
        <InputGroup className="mb-3">
          <FormControl
            defaultValue={admin}
            onChange={updateAdmin}
            id="newAdminAddress"
          />
          <Button
            onClick={() => saveOption(factoryMethods.setFeeToSetter)}
            pending={pending}
            disabled={pending || !admin}
          >
            Save
          </Button>
        </InputGroup>

        <Form.Label htmlFor="feeRecipient">Fee recipient</Form.Label>
        <InputGroup className="mb-3">
          <FormControl
            defaultValue={feeRecipient}
            onChange={updateFeeRecipient}
            id="feeRecipient"
          />
          <Button
            onClick={() => saveOption(factoryMethods.setFeeTo)}
            pending={pending}
            disabled={pending || !feeRecipient}
          >
            Save
          </Button>
        </InputGroup>

        <InputGroup className="mb-3">
          <InputGroup.Checkbox
            aria-label="All fees to the admin"
            onChange={updateFeesToAdmin}
          />
          <InputGroup.Text>
            All fees to the admin (no fees for liquidity providers)
          </InputGroup.Text>
          <Button
            onClick={() => saveOption(factoryMethods.setAllFeeToProtocol)}
            pending={pending}
          >
            Save
          </Button>
        </InputGroup>
      </div>
    </section>
  )
}
