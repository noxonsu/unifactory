import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InputGroup, FormControl, Form, Row, Col, Alert } from 'react-bootstrap'
import { Button } from './Button'
import { TokenList } from './TokenList'
import { saveProjectOption, fetchOptionsFromContract, getData } from '../utils'
import { projectOptions } from '../constants'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [chainId, setChainId] = useState('')

  useEffect(async () => {
    if (web3React.active) {
      const id = await web3React?.library.eth.getChainId()
      setChainId(id)
    } else {
      setChainId('')
    }
  }, [web3React?.active])

  const [notification, setNotification] = useState('')
  const [storageContract, setStorageContract] = useState(
    '0xafc031187b36372430a5f9D39cF5F1D9e7ba91b2'
  )

  const updateStorageContract = (event) =>
    setStorageContract(event.target.value)

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [tokens, setTokens] = useState([])

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
        const { brandColor, logo, name, tokenList } = projectInfo

        console.log('projectInfo: ', projectInfo)

        if (name) setProjectName(name)
        if (logo) setLogoUrl(logo)
        if (brandColor) setBrandColor(brandColor)
        if (tokenList) setTokens(tokens)
      }
    } catch (error) {
    } finally {
      setPending(false)
    }
  }

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
        value = tokens
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

  const [updateButtonIsAvailable, setUpdateButtonIsAvailable] = useState(false)

  useEffect(() => {
    const buttonIsAvailable =
      web3React?.active &&
      storageContract &&
      (logoUrl || brandColor || projectName)

    setUpdateButtonIsAvailable(!!buttonIsAvailable)
  }, [projectName, logoUrl, brandColor, web3React?.active])

  const canNotUseStorage = pending || !storageContract || !web3React?.active

  return (
    <section>
      {notification && <Alert variant="warning">{notification}</Alert>}

      <ul className="list-unstyled">
        <li>* required field</li>
      </ul>

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

      <div
        className={`${
          !web3React?.active || pending || !storageContract ? 'disabled' : ''
        }`}
      >
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

        <h5 className="mb-3">Token list</h5>

        <TokenList
          tokens={tokens}
          setTokens={setTokens}
          pending={pending}
          setPending={setPending}
          setError={setError}
        />

        <div className="d-grid">
          <Button
            pending={pending}
            onClick={() => saveOption(projectOptions.TOKENS)}
            disabled={canNotUseStorage}
          >
            Save tokens
          </Button>
        </div>
      </div>
    </section>
  )
}
