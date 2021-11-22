import { useWeb3React } from '@web3-react/core'
import { networks } from './constants'
import { Button, ListGroup, Alert, Row, Col } from 'react-bootstrap'
import { injected, walletconnect } from './utils'

export function Wallet(props) {
  const { activateWallet, pending } = props
  const web3React = useWeb3React()

  const connectionButtons = [
    {
      connector: injected,
      name: 'Connect Metamask',
    },
    {
      connector: walletconnect,
      name: 'WalletConnect',
    },
  ]

  return (
    <section className="mb-3">
      <Row className="mb-3">
        {connectionButtons.map((data, index) => {
          const { name, connector } = data

          return (
            <Col key={index} className="d-grid">
              <Button
                variant="primary"
                onClick={() => activateWallet(connector)}
                disabled={pending || web3React?.active}
              >
                {pending
                  ? 'Pending...'
                  : web3React?.active
                  ? 'Connected'
                  : name}
              </Button>
            </Col>
          )
        })}
      </Row>

      <div className="mb-3">
        {web3React.active ? (
          <ListGroup>
            <ListGroup.Item variant="light">
              Network: {networks[web3React.chainId]?.name}
            </ListGroup.Item>
            <ListGroup.Item variant="light">
              Account: {web3React.account}
            </ListGroup.Item>
          </ListGroup>
        ) : (
          <Alert variant="warning">Your account is not connected</Alert>
        )}
      </div>
    </section>
  )
}
