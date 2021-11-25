import { useState, useEffect, useCallback } from 'react'
import { useWeb3React } from '@web3-react/core'
import {
  Container,
  InputGroup,
  FormControl,
  Form,
  ListGroup,
  Alert,
  ProgressBar,
  Row,
  Col,
} from 'react-bootstrap'
import { Button } from './Button'
import { deploySwapContract, deployStorage } from '../utils'

export function Deployment(props) {
  const { pending, setPending, error, setError } = props

  const web3React = useWeb3React()
  const [canDeploySwapContract, setCanDeploySwapContract] = useState(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)
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

  const [factoryAddress, setFactoryAddress] = useState('')
  const [routerAddress, setRouterAddress] = useState('')
  const [storageAddress, setStorageAddress] = useState('')

  const saveData = (key, value) => {
    const strData = window.localStorage.getItem('userDeploymentData')

    if (strData) {
      const data = JSON.parse(strData)

      data[key] = value

      window.localStorage.setItem('userDeploymentData', JSON.stringify(data))
    } else {
      window.localStorage.setItem(
        'userDeploymentData',
        JSON.stringify({
          [key]: value,
        })
      )
    }
  }
  const getData = (key) => {
    const info = window.localStorage.getItem('userDeploymentData')

    if (info) return info[key]
  }

  const addContractInfo = (name, receipt) => {
    try {
      saveData(`${name}_${receipt.contractAddress}`, receipt.contractAddress)
    } catch (error) {
      setError(error)
    }
  }

  const [deploymentProcessPercent, setDeploymentProcessPercent] =
    useState(false)

  const onSwapDeploy = async () => {
    setPending(true)
    setDeploymentProcessPercent(5)
    setFactoryAddress('')
    setRouterAddress('')

    try {
      const result = await deploySwapContract({
        library: web3React.library,
        admin: adminAddress,
        feeRecipient: feeAddress,
        onFactoryDeploy: (receipt) => {
          setFactoryAddress(receipt.contractAddress)
          addContractInfo('Factory', receipt)
          setDeploymentProcessPercent(40)
        },
        onRouterDeploy: (receipt) => {
          setRouterAddress(receipt.contractAddress)
          addContractInfo('Router', receipt)
          setDeploymentProcessPercent(90)
        },
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
      setDeploymentProcessPercent(false)
    }
  }

  const onStorageDeploy = async () => {
    setPending(true)
    setDeploymentProcessPercent(20)
    setStorageAddress('')

    try {
      const storageInstance = await deployStorage({
        onDeploy: (receipt) => {
          setStorageAddress(receipt.contractAddress)
          addContractInfo('Storage', receipt)
          setDeploymentProcessPercent(100)
        },
        library: web3React.library,
        admin: adminAddress,
      })
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
      setDeploymentProcessPercent(false)
    }
  }

  useEffect(() => {
    setCanDeploySwapContract(
      web3React?.active &&
        isValidAddress(adminAddress) &&
        isValidAddress(feeAddress)
    )

    setCanDeployStorage(web3React?.active && isValidAddress(adminAddress))
  }, [isValidAddress, adminAddress, feeAddress, web3React?.active])

  return (
    <>
      <section
        className={`mb-4 ${!web3React?.active || pending ? 'disabled' : ''}`}
      >
        <ul className="list-unstyled">
          <li>* required for Swap contracts and a Storage contract</li>
          <li>** required only for a Swap contract</li>
        </ul>

        <Form.Label htmlFor="adminAddress">Admin address *</Form.Label>
        <InputGroup className="mb-3">
          <FormControl
            defaultValue={adminAddress}
            onChange={onAdminChange}
            id="adminAddress"
          />
        </InputGroup>

        <Form.Label htmlFor="feeRecipientAddress">
          Fee recipient address **
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

      <Row className="mb-3">
        <Col className="d-grid">
          <Button
            onClick={onSwapDeploy}
            pending={pending}
            disabled={pending || !canDeploySwapContract}
          >
            Deploy swap contracts
          </Button>
        </Col>

        <Col className="d-grid">
          <Button
            onClick={onStorageDeploy}
            pending={pending}
            disabled={pending || !canDeployStorage}
          >
            Deploy Storage
          </Button>
        </Col>
      </Row>

      {typeof deploymentProcessPercent === 'number' && (
        <ProgressBar
          animated
          now={deploymentProcessPercent}
          className="mb-3"
          variant="success"
        />
      )}

      {factoryAddress && (
        <Alert variant="success">
          <strong>Factory</strong>: {factoryAddress}
        </Alert>
      )}
      {routerAddress && (
        <Alert variant="success">
          <strong>Router</strong>: {routerAddress}
        </Alert>
      )}
      {storageAddress && (
        <Alert variant="success">
          <strong>Storage</strong>: {storageAddress}
        </Alert>
      )}
    </>
  )
}
