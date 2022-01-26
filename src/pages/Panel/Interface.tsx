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
import ListFactory from 'components/ListFactory'
import MenuLinksFactory, { LinkItem } from 'components/MenuLinksFactory'
import TextBlock from 'components/TextBlock'
import { saveProjectOption } from 'utils/storage'
import { deployStorage } from 'utils/contract'
import { parseENSAddress } from 'utils/parseENSAddress'
import uriToHttp from 'utils/uriToHttp'
import { storageMethods } from '../../constants'
import networks from 'networks.json'
import ConfirmationModal from './ConfirmationModal'

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
  const { domain, pending, setPending } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()
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
  } = useAppState()

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)

  useEffect(() => {
    setCanDeployStorage(Boolean(stateFactory && stateRouter))
  }, [library, stateFactory, stateRouter])

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
          setAttemptingTxn(false)
        },
        library,
        admin: stateAdmin,
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
  const [brandColor, setBrandColor] = useState(stateBrandColor)
  const [navigationLinks, setNavigationLinks] = useState<LinkItem[]>(stateNavigationLinks)
  const [menuLinks, setMenuLinks] = useState<LinkItem[]>(stateMenuLinks)
  const [socialLinks, setSocialLinks] = useState<string[]>(stateSocialLinks)
  const [addressesOfTokenLists, setAddressesOfTokenLists] = useState<string[]>(stateAddressesOfTokenLists)
  const [tokenLists, setTokenLists] = useState<any>(stateTokenLists)

  const updateBrandColor = (color: { hex: string }) => setBrandColor(color.hex)

  const saveSettings = async () => {
    setPending(true)

    try {
      await saveProjectOption({
        //@ts-ignore
        library,
        storageAddress: stateStorage,
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
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    setPending(false)
  }

  const [fullUpdateIsAvailable, setFullUpdateIsAvailable] = useState(false)

  useEffect(() => {
    setFullUpdateIsAvailable(
      Boolean(
        stateStorage && (logoUrl || brandColor || projectName || socialLinks.length || addressesOfTokenLists.length)
      )
    )
  }, [stateStorage, projectName, logoUrl, brandColor, socialLinks, addressesOfTokenLists])

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

      <Title>{t('deployment')}</Title>

      {!stateFactory || !stateRouter ? <TextBlock warning>{t('youHaveToDeploySwapContractsFirst')}</TextBlock> : null}
      <Button onClick={() => setShowConfirm(true)} disabled={pending || !canDeployStorage}>
        {t('deployStorage')}
      </Button>

      <Title>{t('settings')}</Title>

      <div className={`${!stateStorage || pending ? 'disabled' : ''}`}>
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
        <TokenLists pending={pending} setPending={setPending} tokenLists={tokenLists} setTokenLists={setTokenLists} />
        <Button onClick={createNewTokenList}>{t('createNewTokenList')}</Button>
      </div>
    </section>
  )
}
