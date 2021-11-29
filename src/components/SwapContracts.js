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
    '0xb3CB8e6f1DD233e48CF7FdC0CfBc30BaF285fAa4'
  )
  const [admin, setAdmin] = useState('')
  const [feeRecipient, setFeeRecipient] = useState('')

  const updateFactory = (event) => setFactory(event.target.value)
  const updateAdmin = (event) => setAdmin(event.target.value)
  const updateFeeRecipient = (event) => setFeeRecipient(event.target.value)

  // TODO: valid factory
  // useState(() => {
  //   if () {

  //   }
  // }, [factory])

  const saveOption = async (method) => {
    let value

    switch (method) {
      case factoryMethods.setFeeToSetter:
        value = admin
        break
      case factoryMethods.setFeeTo:
        value = feeRecipient
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
        />
      </InputGroup>

      <p className="highlightedInfo">
        Only admin can change a fee recipient address. You can use the same
        address for both inputs.
      </p>

      <div className={`${!factory || pending ? 'disabled' : ''}`}>
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
      </div>
    </section>
  )
}
