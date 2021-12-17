import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ZERO_ADDRESS } from 'sdk'
import { useActiveWeb3React } from 'hooks'
import { useRegistryContract } from 'hooks/useContract'
import useDomainInfo from 'hooks/useDomainInfo'
import { ButtonPrimary } from 'components/Button'
import { TokenLists } from './TokenLists'
import AddressInputPanel from 'components/AddressInputPanel'
import { saveProjectOption, fetchOptionsFromContract } from 'utils/storage'
import { isValidAddress } from 'utils/contract'
import { storageMethods } from '../../../constants'
import networks from 'networks.json'

export function InterfaceOptions(props: any) {
  const { pending, setPending, setError } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()
  //@ts-ignore
  const registry = useRegistryContract(networks[chainId]?.registry)

  const { data: domainData } = useDomainInfo()

  const [notification, setNotification] = useState<false | string>('')
  const [storage, setStorage] = useState(domainData !== null ? domainData?.storage : '')
  const [storageIsCorrect, setStorageIsCorrect] = useState(false)

  useEffect(() => {
    if (library) {
      const isStorageCorrect = isValidAddress(library, storage)

      setStorageIsCorrect(isStorageCorrect)
      setError(storage && !isStorageCorrect ? new Error('Incorrect address') : false)
    }
  }, [setError, library, storage])

  useEffect(() => {
    if (Boolean(storage)) return

    const SECOND = 1_000
    const MAX_TRACKING_TIME = SECOND * 10
    let timer = 0

    const interval = setInterval(async () => {
      timer += SECOND

      if (!registry) return

      const currentDomain = window.location.hostname || document.location.host
      const storage = await registry.domainStorage(currentDomain)

      if (storage && storage !== ZERO_ADDRESS) {
        setStorage(storage)
        clearInterval(interval)
      }

      if (timer >= MAX_TRACKING_TIME) {
        setNotification(
          'We have not found a storage contract. You have to deploy it in the Deployment tab. After a while you can see storage contract on this page. If you have already deployed it, wait for a while and try to reload this page.'
        )
        clearInterval(interval)
      }
    }, SECOND)

    return () => {
      if (interval) clearInterval()
    }
  }, [registry, storage])

  const [domain, setDomain] = useState('')
  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [tokenLists, setTokenLists] = useState<any>([])

  const updateBrandColor = (event: any) => setBrandColor(event.target.value)

  const fetchProjectOptions = async () => {
    if (!library) return

    setPending(true)

    try {
      const data: any = await fetchOptionsFromContract(library, storage)

      if (data) {
        const { domain, brandColor, logo, name, tokenLists } = data

        if (domain) setDomain(domain)
        if (name) setProjectName(name)
        if (logo) setLogoUrl(logo)
        if (brandColor) setBrandColor(brandColor)
        if (tokenLists.length) {
          setTokenLists([])

          tokenLists.forEach(async (tokenLists: any) =>
            setTokenLists((oldData: any) => [...oldData, JSON.parse(tokenLists)])
          )
        }
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const createNewTokenList = () => {
    setTokenLists((oldData: any) => [
      ...oldData,
      {
        name: 'Template list',
        logoURI: '',
        tokens: [],
      },
    ])
  }

  const saveOption = async (method: string) => {
    if (!library) return

    let value

    switch (method) {
      case storageMethods.setDomain:
        value = domain
        break
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
          domain,
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
      const receipt: any = await saveProjectOption(library, storage, method, value)

      if (receipt?.status) {
        setNotification(`Saved in transaction: ${receipt?.transactionHash}`)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const [fullUpdateIsAvailable, setFullUpdateIsAvailable] = useState(false)

  useEffect(() => {
    const fullUpdateIsAvailable = storage && logoUrl && brandColor && !!projectName

    setFullUpdateIsAvailable(!!fullUpdateIsAvailable)
  }, [storage, projectName, logoUrl, brandColor])

  return (
    <section>
      {notification && <p>{notification}</p>}

      <AddressInputPanel label="Storage contract *" value={storage} onChange={setStorage} disabled />
      <ButtonPrimary onClick={fetchProjectOptions} disabled={!storageIsCorrect || pending}>
        {t('fetchOptions')}
      </ButtonPrimary>

      <div className={`${pending || !storageIsCorrect ? 'disabled' : ''}`}>
        <AddressInputPanel label="Project name" value={projectName} onChange={setProjectName} />
        <ButtonPrimary onClick={() => saveOption(storageMethods.setProjectName)} disabled={!projectName}>
          {t('save')}
        </ButtonPrimary>

        <AddressInputPanel label="Logo url" value={logoUrl} onChange={setLogoUrl} />
        <ButtonPrimary onClick={() => saveOption(storageMethods.setLogoUrl)} disabled={!logoUrl}>
          {t('save')}
        </ButtonPrimary>

        <input type="color" defaultValue={brandColor} title="Brand color" onChange={updateBrandColor} />
        <ButtonPrimary onClick={() => saveOption(storageMethods.setBrandColor)} disabled={!brandColor}>
          {t('save')}
        </ButtonPrimary>

        <ButtonPrimary onClick={() => saveOption(storageMethods.setFullData)} disabled={!fullUpdateIsAvailable}>
          {t('saveAllOptions')}
        </ButtonPrimary>

        <h4>{t('tokenLists')}</h4>

        <TokenLists
          storage={storage}
          pending={pending}
          setPending={setPending}
          setError={setError}
          setNotification={setNotification}
          tokenLists={tokenLists}
          setTokenLists={setTokenLists}
        />
        <ButtonPrimary onClick={createNewTokenList}>{t('createNewTokenList')}</ButtonPrimary>
      </div>
    </section>
  )
}
