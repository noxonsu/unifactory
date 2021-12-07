import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import {
  InputGroup,
  FormControl,
  Form,
  Alert,
  ProgressBar,
  Row,
  Col,
} from 'react-bootstrap'
import networks from '../networks.json'
import { Button } from './Button'
import {
  deploySwapContracts,
  deployStorage,
  isValidAddress,
  returnTokenInfo,
} from '../utils'

export function Deployment(props) {
  const {
    pending,
    error,
    setPending,
    setError,
    wrappedToken,
    setWrappedToken,
  } = props

  const web3React = useWeb3React()
  const [canDeploySwapContracts, setCanDeploySwapContracts] = useState(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)
  const [adminAddress, setAdminAddress] = useState('')

  const onAdminChange = (event) => setAdminAddress(event.target.value)
  const updateWrappedToken = (event) => setWrappedToken(event.target.value)

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

  // TODO: display available info from localStorage
  // const getData = (key) => {
  //   const info = window.localStorage.getItem('userDeploymentData')

  //   if (info) return info[key]
  // }

  const addContractInfo = (name, receipt) => {
    try {
      saveData(`${name}_${receipt.contractAddress}`, receipt.contractAddress)
    } catch (error) {
      setError(error)
    }
  }

  const [deploymentProcessPercent, setDeploymentProcessPercent] =
    useState(false)

  const onContractsDeployment = async () => {
    setPending(true)
    setDeploymentProcessPercent(5)
    setFactoryAddress('')
    setRouterAddress('')

    try {
      const tokenInfo = await returnTokenInfo(web3React.library, wrappedToken)

      if (!tokenInfo) {
        return setError(
          new Error(
            'It is not a wrapped token address. Double check it and try again.'
          )
        )
      }

      const result = await deploySwapContracts({
        library: web3React.library,
        admin: adminAddress,
        wrappedToken,
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
      await deployStorage({
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
    setCanDeploySwapContracts(
      web3React?.active &&
        isValidAddress(web3React.library, adminAddress) &&
        wrappedToken &&
        isValidAddress(web3React.library, wrappedToken)
    )

    setCanDeployStorage(
      web3React?.active && isValidAddress(web3React.library, adminAddress)
    )
  }, [web3React.library, adminAddress, web3React?.active, wrappedToken])

  return (
    <section
      className={`mb-4 ${!web3React?.active || pending ? 'disabled' : ''}`}
    >
      <Form.Label htmlFor="adminAddress">Admin address *</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          defaultValue={adminAddress}
          onChange={onAdminChange}
          id="adminAddress"
        />
      </InputGroup>

      <Form.Label htmlFor="wrappedToken">Wrapped token *</Form.Label>
      <p className="highlightedInfo">
        Wrapped token - ERC20 token that represents a native EVM network
        currency (ETH, BNB, MATIC, etc.). In order the native currency to be
        exchanged with other ERC20 tokens, it needs to be wrapped. Wrapping the
        native currency does not affect its value. For example 1 ETH = 1 WETH.
      </p>
      <InputGroup className="mb-3" key={wrappedToken}>
        <FormControl
          defaultValue={wrappedToken}
          disabled={
            // don't allow the user to change a token address
            // in case if we have it in our config
            networks[web3React.chainId]?.wrappedToken && wrappedToken
          }
          onChange={updateWrappedToken}
          id="wrappedToken"
        />
      </InputGroup>

      <Row>
        <Col className="d-grid">
          <p className="highlightedInfo">
            Main contracts to use swaps, add and remove liquidity
          </p>
        </Col>

        <Col className="d-grid">
          <p className="highlightedInfo">
            Contract for storing project information
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col className="d-grid">
          <Button
            onClick={onContractsDeployment}
            pending={pending}
            disabled={pending || !canDeploySwapContracts}
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

      <h5>Deployment information</h5>
      <p className="highlightedInfo">
        You can see the latest information about deployed contracts below. Don't
        forget to save it.
      </p>

      {typeof deploymentProcessPercent === 'number' && (
        <ProgressBar
          animated
          now={deploymentProcessPercent}
          className="mb-3"
          variant="success"
        />
      )}

      {/* TODO: display a Pair contract hash too*/}
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
    </section>
  )
}
