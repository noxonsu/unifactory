import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import {
  Button,
  InputGroup,
  FormControl,
  Form,
  Row,
  Col,
  Alert,
} from 'react-bootstrap'
import { TokenLists } from './TokenLists'
import { saveOptionsToContract, getData } from '../utils'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [notification, setNotification] = useState('')
  // TODO: remove the temp contract value
  const [storageContract, setStorageContract] = useState(
    '0x2d26D82ffc081a1fD70f06703276EB578202C235'
  )

  const updateStorageContract = (event) =>
    setStorageContract(event.target.value)

  // const [publicKey, setPublicKey] = useState('')
  // const [privateKey, setPrivateKey] = useState('')
  // const [optionsCID, setOptionsCID] = useState('')

  // const updatePublicKey = (event) => setPublicKey(event.target.value)
  // const updatePrivateKey = (event) => setPrivateKey(event.target.value)
  // const updateOptionsCID = (event) => setOptionsCID(event.target.value)

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [tokenLists, setTokenLists] = useState([])

  const updateProjectName = (event) => setProjectName(event.target.value)
  const updateLogoUrl = (event) => setLogoUrl(event.target.value)
  const updateBrandColor = (event) => setBrandColor(event.target.value)

  // const getAvailableOptions = async () => {
  //   if (!optionsCID) return

  //   setPending(true)

  //   try {
  //     const userOptions = await getData(optionsCID)
  //     console.log('userOptions: ', userOptions)

  //     window.localStorage.setItem(
  //       'userProjectOptions',
  //       JSON.stringify(userOptions)
  //     )

  //     if (userOptions && !Object.keys(userOptions).length) {
  //       setNotification('You do not have any saved options')
  //     } else {
  //       const { logoUrl, brandColor, projectName, tokenLists } = userOptions

  //       setProjectName(projectName)
  //       setLogoUrl(logoUrl)
  //       setBrandColor(brandColor)
  //       setTokenLists(tokenLists)
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   } finally {
  //     setPending(false)
  //   }
  // }

  const returnCurrentOptions = () => ({
    projectName,
    logoUrl,
    brandColor,
    tokenLists,
  })

  const updateOptions = async () => {
    const oldOptions = window.localStorage.getItem('userProjectOptions')
    const currentOptions = returnCurrentOptions()

    // if we have at least one token list, there is timestamp value
    // with this value we always will get false in this expression
    if (JSON.stringify(oldOptions) === JSON.stringify(currentOptions)) {
      setNotification('You did not change anything')
    } else {
      setPending(true)

      try {
        const result = await saveOptionsToContract(
          web3React?.library,
          storageContract,
          currentOptions
        )
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
      web3React?.active &&
      storageContract &&
      (logoUrl || brandColor || projectName)
    // publicKey && privateKey && (logoUrl || brandColor || projectName)

    setUpdateButtonIsAvailable(!!buttonIsAvailable)
  }, [projectName, logoUrl, brandColor, web3React?.active])

  /* Pinata.cloud
      <Row className="mb-3">
        <Col className="d-grid">
          <Button
            variant="primary"
            onClick={getAvailableOptions}
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

        <Col className="d-grid">
          <InputGroup className="mb-2">
            <FormControl
              type="text"
              onChange={updateOptionsCID}
              placeholder="Project options CID"
            />
          </InputGroup>
        </Col>
      </Row>
  */

  return (
    <section>
      {notification && <Alert variant="warning">{notification}</Alert>}

      <Form.Label htmlFor="storageContractInput">Storage contract *</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="storageContractInput"
          defaultValue={storageContract}
          onChange={updateStorageContract}
        />
      </InputGroup>

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

      <TokenLists tokenLists={tokenLists} />

      <ul className="list-unstyled">
        <li>* required field</li>
      </ul>

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
