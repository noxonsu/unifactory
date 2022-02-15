import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import validUrl from 'valid-url'
import styled from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup, useAppState } from 'state/application/hooks'
import { HuePicker } from 'react-color'
import { ButtonPrimary } from 'components/Button'
import { TokenLists } from './TokenLists'
import InputPanel from 'components/InputPanel'
import Accordion from 'components/Accordion'
import Toggle from 'components/Toggle'
import ListFactory from 'components/ListFactory'
import MenuLinksFactory, { LinkItem } from 'components/MenuLinksFactory'
import TextBlock from 'components/TextBlock'
import { PartitionWrapper } from './index'
import { saveProjectOption } from 'utils/storage'
import { deployStorage } from 'utils/contract'
import { parseENSAddress } from 'utils/parseENSAddress'
import uriToHttp from 'utils/uriToHttp'
import { storageMethods } from '../../constants'
import networks from 'networks.json'
import ConfirmationModal from './ConfirmationModal'
import useWordpressInfo from 'hooks/useWordpressInfo'

const OptionWrapper = styled.div<{ margin?: number; flex?: boolean }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;

  ${({ flex }) => (flex ? 'display: flex; align-items: center; justify-content: space-between' : '')}
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
  margin: 1.4rem 0 0.6rem;
`

const NumList = styled.ol`
  padding: 0 0 0 1rem;

  li:not(:last-child) {
    margin-bottom: 0.4rem;
  }
`

const colorPickerStyles = {
  default: {
    picker: {
      width: '100%',
    },
  },
}

export default function Interface(props: any) {
  const { domain, pending, setPending, setDomainDataTrigger } = props
  const { t } = useTranslation()
  const { library, chainId, account } = useActiveWeb3React()
  const wordpressData = useWordpressInfo()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()

  const {
    admin: stateAdmin,
    factory: stateFactory,
    router: stateRouter,
    storage: stateStorage,
    projectName: stateProjectName,
    logo: stateLogo,
    brandColor: stateBrandColor,
    navigationLinks: stateNavigationLinks,
    menuLinks: stateMenuLinks,
    socialLinks: stateSocialLinks,
    addressesOfTokenLists: stateAddressesOfTokenLists,
    tokenLists: stateTokenLists,
    disableSourceCopyright: stateDisableSourceCopyright,
  } = useAppState()

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)

  useEffect(() => {
    const lowerAccount = account?.toLowerCase()
    const adminIsFine = stateAdmin
      ? lowerAccount === stateAdmin.toLowerCase()
      : wordpressData?.wpAdmin
      ? lowerAccount === wordpressData.wpAdmin.toLowerCase()
      : true

    setCanDeployStorage(Boolean(adminIsFine && stateFactory && stateRouter))
  }, [library, stateFactory, stateRouter, account, wordpressData, stateAdmin])

  const onStorageDeployment = async () => {
    setAttemptingTxn(true)

    try {
      await deployStorage({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        onHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy storage`,
            }
          )
        },
        library,
        admin: stateAdmin,
        onSuccessfulDeploy: () => {
          setAttemptingTxn(false)
          setDomainDataTrigger((state: boolean) => !state)
        },
      })
    } catch (error) {
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
      setAttemptingTxn(false)
    }
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const [projectName, setProjectName] = useState(stateProjectName)
  const [logoUrl, setLogoUrl] = useState(stateLogo)
  const [isValidLogo, setIsValidLogo] = useState(Boolean(validUrl.isUri(stateLogo)))

  useEffect(() => {
    if (logoUrl) {
      setIsValidLogo(Boolean(validUrl.isUri(logoUrl)))
    } else {
      setIsValidLogo(false)
    }
  }, [logoUrl])

  const [brandColor, setBrandColor] = useState(stateBrandColor)

  const updateBrandColor = (color: { hex: string }) => setBrandColor(color.hex)

  const [navigationLinks, setNavigationLinks] = useState<LinkItem[]>(stateNavigationLinks)
  const [menuLinks, setMenuLinks] = useState<LinkItem[]>(stateMenuLinks)
  const [socialLinks, setSocialLinks] = useState<string[]>(stateSocialLinks)
  const [addressesOfTokenLists, setAddressesOfTokenLists] = useState<string[]>(stateAddressesOfTokenLists)
  const [tokenLists, setTokenLists] = useState<any>(stateTokenLists)
  const [disableSourceCopyright, setDisableSourceCopyright] = useState<boolean>(stateDisableSourceCopyright)

  const currentStrSettings = JSON.stringify({
    projectName: stateProjectName,
    logoUrl: stateLogo,
    brandColor: stateBrandColor,
    navigationLinks: stateNavigationLinks,
    menuLinks: stateMenuLinks,
    socialLinks: stateSocialLinks,
    addressesOfTokenLists: stateAddressesOfTokenLists,
    disableSourceCopyright: stateDisableSourceCopyright,
  })

  const [settingsChanged, setSettingsChanged] = useState(false)

  useEffect(() => {
    const newStrSettings = JSON.stringify({
      projectName,
      logoUrl,
      brandColor,
      navigationLinks,
      menuLinks,
      socialLinks,
      addressesOfTokenLists,
      disableSourceCopyright,
    })

    setSettingsChanged(newStrSettings !== currentStrSettings)
  }, [
    currentStrSettings,
    projectName,
    logoUrl,
    brandColor,
    navigationLinks,
    menuLinks,
    socialLinks,
    addressesOfTokenLists,
    disableSourceCopyright,
  ])

  const saveSettings = async () => {
    setPending(true)

    try {
      const storageSettings = JSON.stringify({
        projectName,
        logoUrl,
        brandColor,
        navigationLinks,
        menuLinks,
        socialLinks,
        addressesOfTokenLists,
        disableSourceCopyright,
      })

      await saveProjectOption({
        //@ts-ignore
        library,
        storageAddress: stateStorage,
        method: storageMethods.setSettings,
        value: storageSettings,
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
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    setPending(false)
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

  return (
    <section>
      <ConfirmationModal
        open={showConfirm}
        onDismiss={handleDismissConfirmation}
        onDeployment={onStorageDeployment}
        txHash={txHash}
        attemptingTxn={attemptingTxn}
        titleId={'storageContract'}
        confirmBtnMessageId={'deploy'}
        content={
          <div>
            {t('youAreDeployingStorage')}. {t('youHaveToConfirmTheseTxs')}:
            <NumList>
              <li>{t('deployStorageContract')}</li>
              <li>{t('saveInfoToDomainRegistry')}</li>
            </NumList>
          </div>
        }
      />

      <PartitionWrapper highlighted>
        {!stateFactory || !stateRouter ? <TextBlock warning>{t('youHaveToDeploySwapContractsFirst')}</TextBlock> : null}

        <Accordion title={t('deployment')} openByDefault={!stateStorage} minimalStyles contentPadding>
          {stateStorage ? <TextBlock warning>{t('youAlreadyHaveStorageContractWarning')}</TextBlock> : <></>}
          <Button onClick={() => setShowConfirm(true)} disabled={pending || !canDeployStorage}>
            {t('deployStorage')}
          </Button>
        </Accordion>
      </PartitionWrapper>

      <Title>{t('settings')}</Title>

      <div className={`${!stateStorage || pending ? 'disabled' : ''}`}>
        <OptionWrapper>
          <InputPanel label={`${t('projectName')}`} value={projectName} onChange={setProjectName} />
        </OptionWrapper>

        <OptionWrapper>
          <InputPanel
            label={`${t('logoUrl')}`}
            value={logoUrl}
            onChange={setLogoUrl}
            error={Boolean(logoUrl) && !isValidLogo}
          />
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

        <OptionWrapper flex>
          {t('Disable source copyright')}

          <Toggle
            isActive={disableSourceCopyright}
            toggle={() => setDisableSourceCopyright((prevState) => !prevState)}
          />
        </OptionWrapper>

        <OptionWrapper margin={0.4}>
          <Label>{t('primaryColor')}</Label>
          <HuePicker color={brandColor} onChangeComplete={updateBrandColor} styles={colorPickerStyles} />
        </OptionWrapper>

        <Button onClick={saveSettings} disabled={!settingsChanged || !isValidLogo}>
          {t('saveSettings')}
        </Button>

        <Title>{t('tokenLists')}</Title>
        <TokenLists pending={pending} setPending={setPending} tokenLists={tokenLists} setTokenLists={setTokenLists} />
        <Button onClick={createNewTokenList}>{t('createNewTokenList')}</Button>
      </div>
    </section>
  )
}
