import { useState, useEffect } from 'react'
import { useWeb3React } from '@web3-react/core'
import { InputGroup, FormControl, Form, Alert } from 'react-bootstrap'
import { Button } from './Button'
import { TokenLists } from './TokenLists'
import {
  saveProjectOption,
  fetchOptionsFromContract,
  isValidAddress,
  getTimestamp,
} from '../utils'
import { storageMethods } from '../constants'

export function InterfaceOptions(props) {
  const { pending, setPending, setError } = props
  const web3React = useWeb3React()

  const [notification, setNotification] = useState('')
  const [storageContract, setStorageContract] = useState(
    '0x2f9CfEB4E7a3DFf011569d242a34a79AA222E3C9'
  )

  const updateStorageContract = (event) =>
    setStorageContract(event.target.value)

  useEffect(() => {
    if (web3React.library) {
      if (
        storageContract &&
        !isValidAddress(web3React.library, storageContract)
      ) {
        setError(new Error('Incorrect storage contract'))
      } else {
        setError(false)
      }
    }
  }, [setError, web3React.library, storageContract])

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
      const data = await fetchOptionsFromContract(
        web3React?.library,
        storageContract
      )

      if (data) {
        const { brandColor, logo, name, tokenLists } = data

        if (name) setProjectName(name)
        if (logo) setLogoUrl(logo)
        if (brandColor) setBrandColor(brandColor)
        if (tokenLists.length) {
          setTokenLists([])

          tokenLists.forEach(async (tokenLists, index) => {
            const list = JSON.parse(tokenLists)

            setTokenLists((oldData) => [...oldData, list])
          })
        }
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const createNewTokenList = () => {
    setTokenLists((oldData) => [
      ...oldData,
      {
        name: 'Template list',
        tokens: [],
      },
    ])
  }

  const saveOption = async (method) => {
    let value

    switch (method) {
      case storageMethods.setProjectName:
        value = projectName
        break
      case storageMethods.setLogoUrl:
        value = logoUrl
        break
      case storageMethods.setBrandColor:
        value = brandColor
        break
      case storageMethods.setFullData:
        value = {
          name: projectName,
          logo: logoUrl,
          brandColor,
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
        method,
        value
      )

      if (receipt.status) {
        setNotification(`Saved in transaction: ${receipt.transactionHash}`)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const [fullUpdateIsAvailable, setFullUpdateIsAvailable] = useState(false)

  useEffect(() => {
    const fullUpdateIsAvailable =
      web3React?.active &&
      storageContract &&
      logoUrl &&
      brandColor &&
      projectName

    setFullUpdateIsAvailable(!!fullUpdateIsAvailable)
  }, [storageContract, projectName, logoUrl, brandColor, web3React?.active])

  const canNotUseStorage = pending || !storageContract || !web3React?.active

  return (
    <section className={canNotUseStorage ? 'disabled' : ''}>
      {notification && <Alert variant="info">{notification}</Alert>}

      <Form.Label htmlFor="storageContractInput">Storage contract *</Form.Label>
      <InputGroup className="mb-3">
        <FormControl
          type="text"
          id="storageContractInput"
          defaultValue={storageContract}
          onChange={updateStorageContract}
        />
        <Button onClick={fetchProjectOptions} pending={pending}>
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
            onClick={() => saveOption(storageMethods.setProjectName)}
            pending={pending}
            disabled={!projectName}
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
            onClick={() => saveOption(storageMethods.setLogoUrl)}
            pending={pending}
            disabled={!logoUrl}
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
            onClick={() => saveOption(storageMethods.setBrandColor)}
            pending={pending}
            disabled={!brandColor}
          >
            Save
          </Button>
        </InputGroup>

        <h5 className="mb-3">Token lists</h5>

        <TokenLists
          storageContract={storageContract}
          pending={pending}
          setPending={setPending}
          setError={setError}
          setNotification={setNotification}
          tokenLists={tokenLists}
          setTokenLists={setTokenLists}
        />

        <div className="d-grid">
          <Button pending={pending} onClick={createNewTokenList}>
            Create a new token list
          </Button>
        </div>

        {/*
        TODO: it will be difficult to save many token lists at once in the Solidity array.
        Maybe reset all lists and set it again with updates every time when we want to update
        all data at once. It's more easier to manipulate theme on the front side
        */}
        {/* <div className="d-grid">
          <Button
            pending={pending}
            onClick={() => saveOption(storageMethods.setFullData)}
            disabled={!fullUpdateIsAvailable}
            size="lg"
          >
            Save all options
          </Button>
        </div> */}
      </div>
    </section>
  )
}
