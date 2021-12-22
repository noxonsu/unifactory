import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ZERO_ADDRESS } from 'sdk'
import { useActiveWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import useInterval from 'hooks/useInterval'
import { useRegistryContract } from 'hooks/useContract'
import { useProjectInfo } from 'state/application/hooks'
import { HuePicker } from 'react-color'
import { ButtonPrimary } from 'components/Button'
import { TokenLists } from './TokenLists'
import InputPanel from 'components/InputPanel'
import AddressInputPanel from 'components/AddressInputPanel'
import { saveProjectOption, fetchOptionsFromContract } from 'utils/storage'
import { isValidAddress } from 'utils/contract'
import { storageMethods } from '../../constants'
import networks from 'networks.json'

const InputWrapper = styled.div`
  margin: 0.2rem 0;
`

const ColorWrapper = styled(InputWrapper)`
  padding: 0.4rem;
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

const Title = styled.h3`
  font-weight: 400;
`

const colorPickerStyles = {
  default: {
    picker: {
      width: '100%',
    },
  },
}

export function InterfaceOptions(props: any) {
  const { pending, setPending, setError } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  //@ts-ignore
  const registry = useRegistryContract(networks[chainId]?.registry)

  const { storage: stateStorage } = useProjectInfo()

  const [notification, setNotification] = useState<false | string>('')
  const [storage, setStorage] = useState(stateStorage || '')
  const [storageIsCorrect, setStorageIsCorrect] = useState(false)

  useEffect(() => {
    if (library) {
      const isStorageCorrect = isValidAddress(library, storage)

      setStorageIsCorrect(isStorageCorrect)
      setError(storage && !isStorageCorrect ? new Error('Incorrect address') : false)
    }
  }, [setError, library, storage])

  const [timer, setTimer] = useState(0)
  const SECOND = 1_000
  const MAX_TRACKING_TIME = SECOND * 6

  useInterval(
    async () => {
      setTimer(timer + SECOND)

      if (!registry) return

      const currentDomain = window.location.hostname || document.location.host
      const storage = await registry.domainStorage(currentDomain)

      if (storage && storage !== ZERO_ADDRESS) setStorage(storage)
    },
    timer >= MAX_TRACKING_TIME || Boolean(storage) ? null : SECOND
  )

  useEffect(() => {
    if (timer >= MAX_TRACKING_TIME && !Boolean(storage)) {
      setNotification(
        'We have not found a storage contract. You have to deploy it in the Deployment tab. After a while you can see storage contract on this page. If you have already deployed it, wait for a while and try to reload this page.'
      )
    }
  }, [timer, storage, MAX_TRACKING_TIME])

  const [projectName, setProjectName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [brandColor, setBrandColor] = useState('')
  const [socialLinks, setSocialLinks] = useState<string>('')
  // const [menuLinks, setMenuLinks] = useState<string>('')
  const [tokenLists, setTokenLists] = useState<any>([])

  const updateBrandColor = (color: { hex: string }) => setBrandColor(color.hex)

  const fetchProjectOptions = async () => {
    setPending(true)

    try {
      //@ts-ignore
      const data: any = await fetchOptionsFromContract(library, storage)

      if (data) {
        const { strSettings, tokenLists } = data
        const { projectName, logoUrl, brandColor, socialLinks } = JSON.parse(strSettings)

        if (projectName) setProjectName(projectName)
        if (logoUrl) setLogoUrl(logoUrl)
        if (brandColor) setBrandColor(brandColor)
        if (socialLinks) setSocialLinks(socialLinks.join(','))
        if (tokenLists.length) {
          setTokenLists([])

          tokenLists.forEach(async (tokenLists: any) =>
            setTokenLists((oldData: any) => [...oldData, JSON.parse(tokenLists)])
          )
        }
      }
    } catch (error) {
      setError(error)
    }

    setPending(false)
  }

  const saveSettings = async () => {
    setError(false)
    setNotification(false)
    setPending(true)

    try {
      const socialLinksArr = socialLinks ? socialLinks.split(',') : []
      const settings = {
        projectName,
        logoUrl,
        brandColor,
        socialLinks: socialLinksArr,
      }

      await saveProjectOption({
        //@ts-ignore
        library,
        storageAddress: storage,
        method: storageMethods.setSettings,
        value: JSON.stringify(settings),
        onHash: (hash: string) => {
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Settings saved`,
            }
          )
        },
      })
    } catch (error) {
      setError(error)
    }

    setPending(false)
  }

  const [fullUpdateIsAvailable, setFullUpdateIsAvailable] = useState(false)

  useEffect(() => {
    const fullUpdateIsAvailable = Boolean(storage && (logoUrl || brandColor || projectName))

    setFullUpdateIsAvailable(!!fullUpdateIsAvailable)
  }, [storage, projectName, logoUrl, brandColor])

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

  return (
    <section>
      {notification && <p>{notification}</p>}

      <InputWrapper>
        <AddressInputPanel label="Storage contract *" value={storage} onChange={setStorage} disabled />
      </InputWrapper>
      <Button onClick={fetchProjectOptions} disabled={!storageIsCorrect || pending}>
        {t('fetchOptions')}
      </Button>

      <div className={`${pending || !storageIsCorrect ? 'disabled' : ''}`}>
        <InputWrapper>
          <InputPanel label={`${t('projectName')}`} value={projectName} onChange={setProjectName} />
        </InputWrapper>

        <InputWrapper>
          <InputPanel label={`${t('logoUrl')}`} value={logoUrl} onChange={setLogoUrl} />
        </InputWrapper>

        <InputWrapper>
          <InputPanel label={`${t('socialLinks')}`} value={socialLinks} onChange={setSocialLinks} />
        </InputWrapper>

        {/* <InputWrapper>
          <InputPanel label={`${t('menuLinks')}`} value={menuLinks} onChange={setMenuLinks} />
        </InputWrapper> */}

        <ColorWrapper>
          <HuePicker color={brandColor} onChangeComplete={updateBrandColor} styles={colorPickerStyles} />
        </ColorWrapper>

        <Button onClick={saveSettings} disabled={!fullUpdateIsAvailable}>
          {t('saveSettings')}
        </Button>

        <Title>{t('tokenLists')}</Title>

        <TokenLists
          storage={storage}
          pending={pending}
          setPending={setPending}
          setError={setError}
          tokenLists={tokenLists}
          setTokenLists={setTokenLists}
        />
        <Button onClick={createNewTokenList}>{t('createNewTokenList')}</Button>
      </div>
    </section>
  )
}
