import { useState, useEffect } from 'react'
import {
  Button,
  InputGroup,
  FormControl,
  Form,
  Row,
  Col,
  Alert,
} from 'react-bootstrap'
import { TokenList } from './TokenList'
import { pinJson, getAllData } from './utils'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props

  const [notification, setNotification] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')

  const updatePublicKey = (event) => setPublicKey(event.target.value)
  const updatePrivateKey = (event) => setPrivateKey(event.target.value)

  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')

  const fetchAvailableOptions = async () => {
    if (!publicKey || !privateKey) return

    setPending(true)

    try {
      const userOptions = await getAllData(publicKey, privateKey)
      console.log('userOptions: ', userOptions)

      window.localStorage.setItem('userProjectOptions', userOptions)

      if (userOptions && !Object.keys(userOptions).length) {
        setNotification('You do not have any saved options')
      } else {
        const { logoUrl, brandColor } = userOptions

        setLogoUrl(logoUrl)
        setBrandColor(brandColor)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setPending(false)
    }
  }

  const updateOptions = () => {
    if (!publicKey || !privateKey) return

    const oldOptions = window.localStorage.getItem('userProjectOptions')
    console.log('oldOptions: ', oldOptions)

    // build current options somehow
    const currentOptions = {}

    // if we have at least one token list, there is timestamp value
    // with this value we always will get false in this expression
    if (JSON.stringify(oldOptions) === JSON.stringify(currentOptions)) {
      setNotification('You did not change anything')
    } else {
      pinJson(publicKey, privateKey, currentOptions)
    }
  }

  /*
{
    projectName: string
    logoUrl: string (https://...)
    brandColor: string (#fefefe)
    tokenLists: array
}
*/

  const [updateButtonIsAvailable, setUpdateButtonIsAvailable] = useState(true)

  useEffect(() => {
    const buttonIsAvailable = publicKey && privateKey && (logoUrl || brandColor)

    setUpdateButtonIsAvailable(!!buttonIsAvailable)
  }, [logoUrl, brandColor, publicKey, privateKey])

  return (
    <section>
      {notification && <Alert variant="warning">{notification}</Alert>}

      <Row className="mb-3">
        <Col className="d-grid">
          <Button
            variant="primary"
            onClick={fetchAvailableOptions}
            disabled={pending}
          >
            {true ? 'Sign in' : '...'}
          </Button>
        </Col>
        <Col className="d-grid">
          <Button
            variant="primary"
            onClick={() => {}}
            disabled={true || pending}
          >
            Create account
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="d-grid">
          <InputGroup className="mb-2">
            <FormControl
              type="password"
              onChange={updatePublicKey}
              placeholder="Pinata public key"
            />
          </InputGroup>
        </Col>
        <Col className="d-grid">
          <InputGroup className="mb-2">
            <FormControl
              type="password"
              onChange={updatePrivateKey}
              placeholder="Pinata private key"
            />
          </InputGroup>
        </Col>
      </Row>

      <Form.Label htmlFor="logoUrlInput">Logo url</Form.Label>
      <InputGroup className="mb-3">
        <FormControl id="logoUrlInput" defaultValue={logoUrl} />
      </InputGroup>

      <Form.Label htmlFor="brandColorInput">Brand color</Form.Label>
      <InputGroup className="mb-4">
        <Form.Control
          type="color"
          id="brandColorInput"
          defaultValue={brandColor}
          title="Choose your color"
        />
      </InputGroup>

      <h5 className="mb-3">Token lists</h5>

      <TokenList />

      <div className="d-grid">
        <Button
          variant="primary"
          onClick={updateOptions}
          disabled={!updateButtonIsAvailable || pending}
          // || no keys || no options (need at least one of them) || options weren't changed
        >
          {pending ? 'Pending...' : 'Update options'}
        </Button>
      </div>
    </section>
  )
}
