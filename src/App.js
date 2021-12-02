import './App.css'
import { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Container, Tabs, Tab, Alert } from 'react-bootstrap'
import networks from './networks.json'
import { Wallet } from './components/Wallet'
import { Deployment } from './components/Deployment'
import { SwapContracts } from './components/SwapContracts'
import { InterfaceOptions } from './components/InterfaceOptions'

export function App() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  const web3React = useWeb3React()

  const activateWallet = async (connector) => {
    setPending(true)
    setError(false)

    web3React
      .activate(connector, undefined, true)
      .catch(setError)
      .finally(() => setPending(false))
  }

  const [wrappedToken, setWrappedToken] = useState('')
  const [problemWithNetwork, setProblemWithNetwork] = useState('')

  useEffect(() => {
    if (web3React.chainId) {
      if (networks[web3React.chainId]?.wrappedToken) {
        setProblemWithNetwork('')
        setWrappedToken(networks[web3React.chainId].wrappedToken)
      } else {
        setWrappedToken('')
        setProblemWithNetwork(
          `We do not have wrapped token address for this network. Without it you can NOT deploy swap contracts.
          Switch to a different network or enter it manually.`
        )
      }
    }
  }, [web3React.chainId])

  return (
    <Container className="appContainer">
      <main>
        <Wallet activateWallet={activateWallet} pending={pending} />

        {error && (
          <Alert
            variant="danger"
            className="overflowX d-flex align-items-center"
          >
            {error?.code && error.code + ': '}
            {error?.message}
          </Alert>
        )}

        {problemWithNetwork && (
          <Alert variant="warning" className="overflowX">
            {problemWithNetwork}
          </Alert>
        )}

        <ul className="list-unstyled highlightedInfo">
          <li>* required field</li>
        </ul>

        <Tabs
          defaultActiveKey="deployment"
          id="uncontrolled-tab-example"
          className="mb-4"
        >
          <Tab eventKey="deployment" title="Deployment">
            <Deployment
              pending={pending}
              error={error}
              setPending={setPending}
              setError={setError}
              wrappedToken={wrappedToken}
              setWrappedToken={setWrappedToken}
            />
          </Tab>
          <Tab eventKey="swapContracts" title="Swap contracts">
            <SwapContracts
              pending={pending}
              setPending={setPending}
              setError={setError}
            />
          </Tab>
          <Tab eventKey="options" title="Interface Options">
            <InterfaceOptions
              pending={pending}
              setPending={setPending}
              setError={setError}
            />
          </Tab>
        </Tabs>
      </main>
    </Container>
  )
}
