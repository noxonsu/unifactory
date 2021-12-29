import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import validUrl from 'valid-url'
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
import ListFactory from 'components/ListFactory'
import MenuLinksFactory, { LinkItem } from 'components/MenuLinksFactory'
import { saveProjectOption, fetchOptionsFromContract } from 'utils/storage'
import { isValidAddress } from 'utils/contract'
import { parseENSAddress } from 'utils/parseENSAddress'
import uriToHttp from 'utils/uriToHttp'
import { storageMethods } from '../../constants'
import networks from 'networks.json'

const OptionWrapper = styled.div<{ margin?: number }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;
`

const Label = styled.span`
  display: inline-block;
  margin-bottom: 0.7rem;
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

export default function Interface(props: any) {
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
  const [navigationLinks, setNavigationLinks] = useState<LinkItem[]>([])
  const [menuLinks, setMenuLinks] = useState<LinkItem[]>([])
  const [socialLinks, setSocialLinks] = useState<string[]>([])
  const [addressesOfTokenLists, setAddressesOfTokenLists] = useState<string[]>([])
  const [tokenLists, setTokenLists] = useState<any>([])

  const updateBrandColor = (color: { hex: string }) => setBrandColor(color.hex)

  const fetchProjectOptions = async () => {
    setPending(true)

    try {
      //@ts-ignore
      const data: any = await fetchOptionsFromContract(library, storage)

      if (data) {
        const { strSettings, tokenLists } = data
        const { projectName, logoUrl, brandColor, navigationLinks, menuLinks, socialLinks, addressesOfTokenLists } =
          JSON.parse(strSettings)

        if (projectName) setProjectName(projectName)
        if (logoUrl) setLogoUrl(logoUrl)
        if (brandColor) setBrandColor(brandColor)
        if (navigationLinks?.length) setNavigationLinks(navigationLinks)
        if (menuLinks?.length) setMenuLinks(menuLinks)
        if (socialLinks?.length) setSocialLinks(socialLinks)
        if (addressesOfTokenLists?.length) setAddressesOfTokenLists(addressesOfTokenLists)
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
      await saveProjectOption({
        //@ts-ignore
        library,
        storageAddress: storage,
        method: storageMethods.setSettings,
        value: JSON.stringify({
          projectName,
          logoUrl,
          brandColor,
          navigationLinks,
          menuLinks,
          socialLinks,
          addressesOfTokenLists,
        }),
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
    const fullUpdateIsAvailable = Boolean(
      storage && (logoUrl || brandColor || projectName || socialLinks.length || addressesOfTokenLists.length)
    )

    setFullUpdateIsAvailable(!!fullUpdateIsAvailable)
  }, [storage, projectName, logoUrl, brandColor, socialLinks, addressesOfTokenLists])

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

      <OptionWrapper>
        <AddressInputPanel label="Storage contract *" value={storage} onChange={setStorage} disabled />
      </OptionWrapper>
      <Button onClick={fetchProjectOptions} disabled={!storageIsCorrect || pending}>
        {t('fetchOptions')}
      </Button>

      <div className={`${pending || !storageIsCorrect ? 'disabled' : ''}`}>
        <OptionWrapper>
          <InputPanel label={`${t('projectName')}`} value={projectName} onChange={setProjectName} />
        </OptionWrapper>

        <OptionWrapper>
          <InputPanel label={`${t('logoUrl')}`} value={logoUrl} onChange={setLogoUrl} />
        </OptionWrapper>

        <OptionWrapper>
          <MenuLinksFactory
            title={t('navigationLinks')}
            items={navigationLinks}
            setItems={setNavigationLinks}
            isValidItem={(item: LinkItem) => Boolean(validUrl.isUri(item.source))}
          />
        </OptionWrapper>

        <OptionWrapper>
          <MenuLinksFactory
            title={t('menuLinks')}
            items={menuLinks}
            setItems={setMenuLinks}
            isValidItem={(item: LinkItem) => Boolean(validUrl.isUri(item.source))}
          />
        </OptionWrapper>

        <OptionWrapper>
          <ListFactory
            title={t('socialLinks')}
            placeholder="https://"
            items={socialLinks}
            setItems={setSocialLinks}
            isValidItem={(address) => Boolean(validUrl.isUri(address))}
          />
        </OptionWrapper>

        <OptionWrapper>
          <ListFactory
            title={t('addressesOfTokenLists')}
            placeholder="https:// or ipfs://"
            items={addressesOfTokenLists}
            setItems={setAddressesOfTokenLists}
            isValidItem={(address) => uriToHttp(address).length > 0 || Boolean(parseENSAddress(address))}
          />
        </OptionWrapper>

        <OptionWrapper margin={0.4}>
          <Label>{t('primaryColor')}</Label>
          <HuePicker color={brandColor} onChangeComplete={updateBrandColor} styles={colorPickerStyles} />
        </OptionWrapper>

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
