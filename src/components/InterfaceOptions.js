import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InputGroup, FormControl, Form, Alert } from 'react-bootstrap'
import { Button } from './Button'
import { TokenList } from './TokenList'
import {
  saveProjectOption,
  fetchOptionsFromContract,
  returnTokenInfo,
  isValidAddress,
} from '../utils'
import { projectOptions } from '../constants'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [notification, setNotification] = useState('')
  const [storageContract, setStorageContract] = useState(
    '0xE2e4dDbd6254966f174110BC152bdAa7C6D300ce'
  )

  const updateStorageContract = (event) =>
    setStorageContract(event.target.value)

  useEffect(() => {
    if (web3React.library) {
      if (!isValidAddress(web3React.library, storageContract)) {
        setError(new Error('Incorrect storage contract'))
      } else {
        setError(false)
      }
    }
  }, [setError, web3React.library, storageContract])

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [tokenListName, setTokenListName] = useState([])
  const [tokens, setTokens] = useState([])

  const updateProjectName = (event) => setProjectName(event.target.value)
  const updateLogoUrl = (event) => setLogoUrl(event.target.value)
  const updateBrandColor = (event) => setBrandColor(event.target.value)
  const updateTokenListName = (event) => setTokenListName(event.target.value)

  const fetchProjectOptions = async () => {
    setPending(true)

    try {
      const projectInfo = await fetchOptionsFromContract(
        web3React?.library,
        storageContract
      )

      if (projectInfo) {
        const { brandColor, logo, name, listName, tokens } = projectInfo

        console.log('projectInfo: ', projectInfo)

        if (name) setProjectName(name)
        if (logo) setLogoUrl(logo)
        if (brandColor) setBrandColor(brandColor)
        if (listName) setTokenListName(listName)
        if (tokens.length) {
          tokens.map(async (address) => {
            const { name, symbol, decimals } = await returnTokenInfo(
              web3React.library,
              address
            )

            setTokens((oldTokens) => [
              ...oldTokens,
              {
                name,
                symbol,
                decimals,
                address,
              },
            ])
          })
        }
      }
    } catch (error) {
      setError(error)
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
        value = {
          name: tokenListName,
          tokens,
        }
        break
      default:
        value = ''
    }

    setError(false)
    setNotification(false)
    setPending(true)

    try {
      const receipt = await saveProjectOption(
        web3React?.library,
        storageContract,
        option,
        value
      )

      if (receipt.status) {
        setNotification(`Updated in transaction: ${receipt.transactionHash}`)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const [updateButtonIsAvailable, setUpdateButtonIsAvailable] = useState(false)

  useEffect(() => {
    const fullUpdateIsAvailable =
      web3React?.active &&
      storageContract &&
      logoUrl &&
      brandColor &&
      projectName

    setUpdateButtonIsAvailable(!!fullUpdateIsAvailable)
  }, [storageContract, projectName, logoUrl, brandColor, web3React?.active])

  const canNotUseStorage = pending || !storageContract || !web3React?.active

  return (
    <section>
      {notification && <Alert variant="warning">{notification}</Alert>}

      <ul className="list-unstyled highlightedInfo">
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
        <InputGroup className="mb-3">
          <InputGroup.Text>Project name</InputGroup.Text>
          <FormControl
            type="text"
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

        <InputGroup className="mb-3">
          <InputGroup.Text>Logo url</InputGroup.Text>
          <FormControl
            type="text"
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

        <InputGroup className="mb-4">
          <InputGroup.Text>Brand color</InputGroup.Text>
          <Form.Control
            type="color"
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

        <InputGroup className="mb-3">
          <InputGroup.Text>List name</InputGroup.Text>
          <FormControl
            type="text"
            defaultValue={tokenListName}
            onChange={updateTokenListName}
          />
        </InputGroup>

        <TokenList
          tokens={tokens}
          setTokens={setTokens}
          pending={pending}
          setPending={setPending}
          setError={setError}
          setNotification={setNotification}
        />

        <div className="d-grid mb-3">
          <Button
            pending={pending}
            onClick={() => saveOption(projectOptions.TOKENS)}
            disabled={canNotUseStorage}
          >
            Save token list
          </Button>
        </div>

        {/* <div className="d-grid">
          <Button
            pending={pending}
            onClick={}
            disabled={!updateButtonIsAvailable}
          >
            Save all options
          </Button>
        </div> */}
      </div>
    </section>
  )
}
