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

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')

  const updateProjectName = (event) => setProjectName(event.target.value)
  const updateLogoUrl = (event) => setLogoUrl(event.target.value)
  const updateBrandColor = (event) => setBrandColor(event.target.value)

  const fetchAvailableOptions = async () => {
    if (!publicKey || !privateKey) return

    setPending(true)

    try {
      const userOptions = await getAllData(publicKey, privateKey)
      console.log('userOptions: ', userOptions)

      window.localStorage.setItem(
        'userProjectOptions',
        JSON.stringify(userOptions)
      )

      if (userOptions && !Object.keys(userOptions).length) {
        setNotification('You do not have any saved options')
      } else {
        const { logoUrl, brandColor, projectName } = userOptions

        setProjectName(projectName)
        setLogoUrl(logoUrl)
        setBrandColor(brandColor)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setPending(false)
    }
  }

  const returnCurrentOptions = () => ({
    projectName,
    logoUrl,
    brandColor,
    // tokenLists: [],
  })

  const updateOptions = async () => {
    if (!publicKey || !privateKey) return

    const oldOptions = window.localStorage.getItem('userProjectOptions')
    const currentOptions = returnCurrentOptions()

    // if we have at least one token list, there is timestamp value
    // with this value we always will get false in this expression
    if (JSON.stringify(oldOptions) === JSON.stringify(currentOptions)) {
      setNotification('You did not change anything')
    } else {
      setPending(true)

      try {
        const result = await pinJson(publicKey, privateKey, currentOptions)

        console.log('pinned result: ', result)
      } catch (error) {
        console.error(error)
      } finally {
        setPending(false)
      }
    }
  }

  /*
{
    projectName: TopScamSwap
    logoUrl: https://image.pngaaa.com/860/1534860-middle.png
    brandColor: string (#fefefe)
    tokenLists: [{
      "name": "",
      "timestamp": "",
      "version": {
        "major": 1,
        "minor": 0,
        "patch": 0
      },
      "logoURI": "",
      "keywords": [""],
      "tokens": [
        {
          "name": "",
          "symbol": "",
          "address": "",
          "chainId": -42,
          "decimals": 18,
        },
      ],
    }]
}
*/

  const [updateButtonIsAvailable, setUpdateButtonIsAvailable] = useState(false)

  useEffect(() => {
    const buttonIsAvailable =
      publicKey && privateKey && (logoUrl || brandColor || projectName)

    setUpdateButtonIsAvailable(!!buttonIsAvailable)
  }, [projectName, logoUrl, brandColor, publicKey, privateKey])

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

      <Form.Label htmlFor="projectNameInput">Project name</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="projectNameInput"
          defaultValue={projectName}
          onChange={updateProjectName}
        />
      </InputGroup>

      <Form.Label htmlFor="logoUrlInput">Logo url</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="logoUrlInput"
          defaultValue={logoUrl}
          onChange={updateLogoUrl}
        />
      </InputGroup>

      <Form.Label htmlFor="brandColorInput">Brand color</Form.Label>
      <InputGroup className="mb-4">
        <Form.Control
          type="color"
          id="brandColorInput"
          defaultValue={brandColor}
          title="Brand color"
          onChange={updateBrandColor}
        />
      </InputGroup>

      <h5 className="mb-3">Token lists</h5>

      <TokenList />

      <div className="d-grid">
        <Button
          variant="primary"
          onClick={updateOptions}
          disabled={!updateButtonIsAvailable || pending}
        >
          {pending ? 'Pending...' : 'Update options'}
        </Button>
      </div>
    </section>
  )
}
