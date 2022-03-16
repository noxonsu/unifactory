import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import validUrl from 'valid-url'
import styled from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup, useAppState } from 'state/application/hooks'
import { ButtonPrimary } from 'components/Button'
import { TokenLists } from './TokenLists'
import InputPanel from 'components/InputPanel'
import Toggle from 'components/Toggle'
import ListFactory from 'components/ListFactory'
import MenuLinksFactory, { LinkItem } from 'components/MenuLinksFactory'
import TextBlock from 'components/TextBlock'
import ColorSelector from 'components/ColorSelector'
import { PartitionWrapper } from './index'
import { saveProjectOption } from 'utils/storage'
import { parseENSAddress } from 'utils/parseENSAddress'
import uriToHttp from 'utils/uriToHttp'
import { storageMethods } from '../../constants'

const OptionWrapper = styled.div<{ margin?: number; flex?: boolean }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;

  ${({ flex }) => (flex ? 'display: flex; align-items: center; justify-content: space-between' : '')}
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

const Title = styled.h3`
  font-weight: 400;
  margin: 1.4rem 0 0.6rem;
`

export default function Interface(props: any) {
  const { pending, setPending } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()

  const {
    factory: stateFactory,
    router: stateRouter,
    projectName: stateProjectName,
    logo: stateLogo,
    brandColor: stateBrandColor,
    backgroundColorDark: stateBackgroundColorDark,
    backgroundColorLight: stateBackgroundColorLight,
    textColorDark: stateTextColorDark,
    textColorLight: stateTextColorLight,
    navigationLinks: stateNavigationLinks,
    menuLinks: stateMenuLinks,
    socialLinks: stateSocialLinks,
    addressesOfTokenLists: stateAddressesOfTokenLists,
    tokenLists: stateTokenLists,
    disableSourceCopyright: stateDisableSourceCopyright,
  } = useAppState()

  const [projectName, setProjectName] = useState(stateProjectName)
  const [logoUrl, setLogoUrl] = useState(stateLogo)
  const [isValidLogo, setIsValidLogo] = useState(Boolean(validUrl.isUri(stateLogo)))

  useEffect(() => {
    if (logoUrl) {
      setIsValidLogo(Boolean(validUrl.isUri(logoUrl)))
    } else {
      setIsValidLogo(true)
    }
  }, [logoUrl])

  const [brandColor, setBrandColor] = useState(stateBrandColor)
  const [backgroundColorDark, setBackgroundColorDark] = useState(stateBackgroundColorDark)
  const [backgroundColorLight, setBackgroundColorLight] = useState(stateBackgroundColorLight)
  const [textColorDark, setTextColorDark] = useState(stateTextColorDark)
  const [textColorLight, setTextColorLight] = useState(stateTextColorLight)

  enum ColorType {
    BRAND,
    BACKGROUND_LIGHT,
    BACKGROUND_DARK,
    TEXT_COLOR_LIGHT,
    TEXT_COLOR_DARK,
  }

  const updateColor = (value: string, type: ColorType) => {
    switch (type) {
      case ColorType.BRAND:
        setBrandColor(value)
        break
      case ColorType.BACKGROUND_LIGHT:
        setBackgroundColorLight(value)
        break
      case ColorType.BACKGROUND_DARK:
        setBackgroundColorDark(value)
        break
      case ColorType.TEXT_COLOR_LIGHT:
        setTextColorLight(value)
        break
      case ColorType.TEXT_COLOR_DARK:
        setTextColorDark(value)
    }
  }

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
    backgroundColorDark: stateBackgroundColorDark,
    backgroundColorLight: stateBackgroundColorLight,
    textColorDark: stateTextColorDark,
    textColorLight: stateTextColorLight,
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
      backgroundColorDark,
      backgroundColorLight,
      textColorDark,
      textColorLight,
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
    backgroundColorDark,
    backgroundColorLight,
    textColorDark,
    textColorLight,
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
        backgroundColorDark,
        backgroundColorLight,
        textColorDark,
        textColorLight,
      })

      await saveProjectOption({
        //@ts-ignore
        library,
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
      {!stateFactory || !stateRouter ? (
        <PartitionWrapper highlighted>
          <TextBlock warning>{t('youHaveToDeploySwapContractsFirst')}</TextBlock>
        </PartitionWrapper>
      ) : null}

      <Title>{t('settings')}</Title>

      <div className={`${!stateFactory || !stateRouter || pending ? 'disabled' : ''}`}>
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
          <ColorSelector
            name={t('primaryColor')}
            defaultColor={stateBrandColor}
            onColor={(color) => updateColor(color, ColorType.BRAND)}
          />
        </OptionWrapper>

        <OptionWrapper margin={0.4}>
          <h4>{t('backgroundColor')}</h4>
          <ColorSelector
            name={t('light')}
            defaultColor={backgroundColorLight}
            onColor={(color) => updateColor(color, ColorType.BACKGROUND_LIGHT)}
          />
          <ColorSelector
            name={t('dark')}
            defaultColor={backgroundColorDark}
            onColor={(color) => updateColor(color, ColorType.BACKGROUND_DARK)}
          />
        </OptionWrapper>

        <OptionWrapper margin={0.5}>
          <h4>{t('textColor')}</h4>
          <ColorSelector
            name={t('light')}
            defaultColor={textColorLight}
            onColor={(color) => updateColor(color, ColorType.TEXT_COLOR_LIGHT)}
          />
          <ColorSelector
            name={t('dark')}
            defaultColor={textColorDark}
            onColor={(color) => updateColor(color, ColorType.TEXT_COLOR_DARK)}
          />
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
