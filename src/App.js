import './App.css'
import { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { Container, Tabs, Tab, Alert } from 'react-bootstrap'
import { deploy } from './utils'
import { Wallet } from './components/Wallet'
import { Deployment } from './components/Deployment'
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

  return (
    <Container className="appContainer">
      <main>
        <Wallet activateWallet={activateWallet} pending={pending} />

        {error && (
          <Alert variant="danger">
            {error?.code && error.code + ': '}
            {error?.message}
          </Alert>
        )}

        <Tabs
          defaultActiveKey="deployment"
          id="uncontrolled-tab-example"
          className="mb-4"
        >
          <Tab eventKey="deployment" title="Deployment">
            <Deployment
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
