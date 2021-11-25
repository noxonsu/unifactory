import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InputGroup, FormControl, Form, Row, Col, Alert } from 'react-bootstrap'
import { Button } from './Button'
import { TokenLists } from './TokenLists'
import { saveProjectOption, fetchOptionsFromContract, getData } from '../utils'
import { projectOptions } from '../constants'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [notification, setNotification] = useState('')
  const [storageContract, setStorageContract] = useState('')

  const updateStorageContract = (event) =>
    setStorageContract(event.target.value)

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [tokenLists, setTokenLists] = useState([])

  const updateProjectName = (event) => setProjectName(event.target.value)
  const updateLogoUrl = (event) => setLogoUrl(event.target.value)
  const updateBrandColor = (event) => setBrandColor(event.target.value)

  const fetchProjectOptions = async () => {
    setPending(true)

    try {
      const projectInfo = await fetchOptionsFromContract(
        web3React?.library,
        storageContract
      )

      if (projectInfo) {
        const { brandColor, logo, name } = projectInfo

        if (name) setProjectName(name)
        if (logo) setLogoUrl(logo)
        if (brandColor) setBrandColor(brandColor)
      }
    } catch (error) {
    } finally {
      setPending(false)
    }
  }

  const returnCurrentOptions = () => ({
    projectName,
    logoUrl,
    brandColor,
    tokenLists,
  })

  const saveOption = async (option) => {
    let value

    switch (option) {
      case projectOptions.NAME:
        value = projectName
        break
      case projectOptions.LOGO:
        value = logoUrl
        break
      case projectOptions.COLOR:
        value = brandColor
        break
      case projectOptions.TOKENS:
        value = tokenLists
    }

    setPending(true)

    try {
      const result = await saveProjectOption(
        web3React?.library,
        storageContract,
        option,
        value
      )
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
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

  const canNotUseStorage = pending || !storageContract || !web3React?.active

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
        <Button
          onClick={fetchProjectOptions}
          pending={pending}
          disabled={canNotUseStorage}
        >
          Fetch options
        </Button>
      </InputGroup>

      <Form.Label htmlFor="projectNameInput">Project name</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="projectNameInput"
          defaultValue={projectName}
          onChange={updateProjectName}
        />
        <Button
          onClick={() => saveOption(projectOptions.NAME)}
          pending={pending}
          disabled={canNotUseStorage || !projectName}
        >
          Save
        </Button>
      </InputGroup>

      <Form.Label htmlFor="logoUrlInput">Logo url</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="logoUrlInput"
          defaultValue={logoUrl}
          onChange={updateLogoUrl}
        />
        <Button
          onClick={() => saveOption(projectOptions.LOGO)}
          pending={pending}
          disabled={canNotUseStorage || !logoUrl}
        >
          Save
        </Button>
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
        <Button
          onClick={() => saveOption(projectOptions.COLOR)}
          pending={pending}
          disabled={canNotUseStorage || !brandColor}
        >
          Save
        </Button>
      </InputGroup>

      <h5 className="mb-3">Token lists</h5>

      <TokenLists tokenLists={tokenLists} />

      <ul className="list-unstyled">
        <li>* required field</li>
      </ul>

      <div className="d-grid">
        <Button
          pending={pending}
          onClick={() => saveOption(projectOptions.TOKENS)}
          disabled={canNotUseStorage}
        >
          Save tokens
        </Button>
      </div>
    </section>
  )
}
