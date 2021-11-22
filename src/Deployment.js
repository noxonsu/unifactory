import { useState, useEffect, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import {
  Container,
  Button,
  InputGroup,
  FormControl,
  Form,
  ListGroup,
} from 'react-bootstrap'
import { deploy } from './utils'

export function Deployment(props) {
  const { pending, setPending, error, setError } = props

  const web3React = useWeb3React()
  const [canDeploy, setCanDeploy] = useState(false)
  const [adminAddress, setAdminAddress] = useState('')
  const [useAdminAsFeeRecipient, setUseAdminAsFeeRecipient] = useState(false)
  const [feeAddress, setFeeAddress] = useState('')

  const isValidAddress = useCallback(
    (address) => {
      // TODO: check a contract address and warn about it
      if (web3React?.active) {
        return web3React.library.utils.isAddress(address)
      }
    },
    [web3React?.active, web3React?.library?.utils]
  )

  const onAdminChange = (event) => {
    if (useAdminAsFeeRecipient) setFeeAddress(event.target.value)

    setAdminAddress(event.target.value)
  }

  const onFeeRecipientChange = (event) => {
    setFeeAddress(event.target.value)
  }

  const changeAdminAsFeeRecipient = () => {
    setUseAdminAsFeeRecipient(!useAdminAsFeeRecipient)

    if (!useAdminAsFeeRecipient && adminAddress) {
      setFeeAddress(adminAddress)
    }
  }

  const deployedData = []

  const startDeploy = async () => {
    setPending(true)

    try {
      const result = await deploy({
        library: web3React.library,
        admin: adminAddress,
        feeRecipient: feeAddress,
        onFactoryDeploy: (receipt) => {
          deployedData.push(
            `Factory transaction hash: ${receipt?.transactionHash}`
          )
          deployedData.push(`Factory: ${receipt?.contractAddress}`)
        },
        onRouterDeploy: (receipt) => {
          deployedData.push(
            `Router transaction hash: ${receipt?.transactionHash}`
          )
          deployedData.push(`Router: ${receipt?.contractAddress}`)
        },
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    const validAddresses =
      isValidAddress(adminAddress) && isValidAddress(feeAddress)

    setCanDeploy(web3React?.active && validAddresses)
  }, [isValidAddress, adminAddress, feeAddress, web3React?.active])

  return (
    <>
      <section className={`mb-4 ${web3React?.active ? '' : 'disabled'}`}>
        <Form.Label htmlFor="adminAddress">Admin address</Form.Label>
        <InputGroup className="mb-3">
          <FormControl
            defaultValue={adminAddress}
            onChange={onAdminChange}
            id="adminAddress"
          />
        </InputGroup>

        <Form.Label htmlFor="feeRecipientAddress">
          Fee recipient address
        </Form.Label>
        <InputGroup className="mb-3">
          <InputGroup.Checkbox onChange={changeAdminAsFeeRecipient} />
          <InputGroup.Text>The same as an admin</InputGroup.Text>
          <FormControl
            defaultValue={feeAddress}
            onChange={onFeeRecipientChange}
            disabled={useAdminAsFeeRecipient}
            id="feeRecipientAddress"
          />
        </InputGroup>
      </section>

      <section className="d-grid mb-3">
        <Button
          size="lg"
          variant="primary"
          onClick={startDeploy}
          disabled={pending || !canDeploy}
        >
          {pending ? 'Pending...' : 'Deploy'}
        </Button>
      </section>

      {deployedData.length ? (
        <section className="mb-3">
          <ListGroup>
            {deployedData.map((item, index) => {
              return (
                <ListGroup.Item key={index} variant="success">
                  {item}
                </ListGroup.Item>
              )
            })}
          </ListGroup>
        </section>
      ) : null}
    </>
  )
}
