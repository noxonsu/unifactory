import React, { useEffect, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { UnsupportedChainIdError } from '@web3-react/core'
import { useTranslation } from 'react-i18next'
import { MdArrowBack } from 'react-icons/md'
import { shortenAddress } from 'utils'
import { getCurrentDomain } from 'utils/app'
import { switchInjectedNetwork } from 'utils/wallet'
import networks from 'networks.json'
import { useDispatch, useSelector } from 'react-redux'
import { SUPPORTED_NETWORKS } from 'connectors'
import { STORAGE_NETWORK_ID, STORAGE_NETWORK_NAME } from '../../constants'
import useWordpressInfo from 'hooks/useWordpressInfo'
import { AppState } from 'state'
import { useAppState } from 'state/application/hooks'
import { setAppManagement } from 'state/application/actions'
import { CleanButton } from 'components/Button'
import TextBlock from 'components/TextBlock'
import Wallet from './Wallet'
import SwapContracts from './SwapContracts'
import Interface from './Interface'
import Additions from './Additions'
import Migration from './Migration'
import Reset from './Reset'

export const PartitionWrapper = styled.div<{ highlighted?: boolean }>`
  margin-top: 1rem;

  ${({ highlighted, theme }) =>
    highlighted ? `border-radius: .6rem; padding: 0.2rem; border: 1px solid ${theme.bg3};` : ''}
`

export const OptionWrapper = styled.div<{ margin?: number; flex?: boolean }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;

  ${({ flex }) => (flex ? 'display: flex; align-items: center; justify-content: space-between' : '')}
`

const Wrapper = styled.section`
  position: relative;
  max-width: 37rem;
  width: 100%;
  border-radius: 1.2rem;
  padding: 1rem;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;
  background-color: ${({ theme }) => theme.bg1};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BackButton = styled(CleanButton)`
  flex-basis: 14%;
  margin-right: 2%;
  padding: 11px;
  border: 1px solid ${({ theme }) => theme.primary4};
  border-radius: 12px;
  color: ${({ theme }) => theme.primary1};
`

const NetworkInfo = styled.div`
  margin: 6px 0;
  padding: 0 8px;
  border-radius: 0.5rem;
  background-color: ${({ theme }) => theme.bg2};

  .row {
    display: flex;
    padding: 4px 0;
    margin: 4px 0;
    justify-content: space-between;

    :not(:last-child) {
      border-bottom: 1px solid ${({ theme }) => theme.bg3};
    }
  }

  strong {
    font-weight: 600;
  }
`

const Tabs = styled.div`
  display: flex;
  border-radius: 0.5rem;
  overflow-x: auto;
  white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.bg3};
`

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  cursor: pointer;
  padding: 0.4rem 0.7rem;
  font-size: 1em;
  border: none;
  background-color: ${({ theme, active }) => (active ? theme.bg2 : 'transparent')};
  color: ${({ theme }) => theme.text1};
  transition: 120ms;

  :first-child {
    border-top-left-radius: inherit;
    border-bottom-left-radius: inherit;
  }

  :last-child {
    border-top-right-radius: inherit;
    border-bottom-right-radius: inherit;
  }

  :hover {
    opacity: 0.5;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0.6rem 0.8rem;
  `}
`

const Content = styled.div`
  border-radius: 1rem;
`

const StyledError = styled.span`
  display: inline-block;
  width: 100%;
  margin: 0.6rem 0 0.2rem;
  padding: 0.4rem;
  overflow-x: auto;
  border-radius: 0.4rem;
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.red1};
`

export enum PanelTab {
  contracts = 'contracts',
  interface = 'interface',
  additions = 'additions',
  migration = 'migration',
  reset = 'reset',
}

type Props = {
  setDomainDataTrigger: (x: any) => void
}

export default function Panel({ setDomainDataTrigger }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [pending, setPending] = useState<boolean>(false)
  const { chainId, account, connector, activate } = useActiveWeb3React()
  const { admin } = useAppState()
  const wordpressData = useWordpressInfo()
  const [error, setError] = useState<any | false>(false)
  const [domain] = useState(getCurrentDomain())
  const [activeNetworks, setActiveNetworks] = useState<any[]>([])

  const switchToNetwork = async (chainId: number) => {
    setPending(true)

    if (connector instanceof InjectedConnector) {
      await switchInjectedNetwork(chainId)
    } // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    else if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector)
        }
      })

    setPending(false)
  }

  useEffect(() => {
    if (wordpressData) {
      const networks = Object.values(SUPPORTED_NETWORKS).filter(({ chainId }) =>
        wordpressData?.wpNetworkIds?.length ? wordpressData.wpNetworkIds.includes(chainId) : true
      )

      setActiveNetworks(networks)
    } else {
      setActiveNetworks(Object.values(SUPPORTED_NETWORKS))
    }
  }, [wordpressData])

  const appManagement = useSelector<AppState, AppState['application']['appManagement']>(
    (state) => state.application.appManagement
  )

  const [wrappedToken, setWrappedToken] = useState('')

  useEffect(() => {
    if (chainId) {
      //@ts-ignore
      setWrappedToken(networks[chainId]?.wrappedToken?.address)
    }
  }, [chainId])

  const backToApp = () => {
    dispatch(setAppManagement({ status: false }))
  }

  const [tab, setTab] = useState<PanelTab>(PanelTab.contracts)

  //@ts-ignore
  const accountPrefix = networks[chainId]?.name || t('account')

  const returnTabs = () => {
    const tabs = [
      { tabKey: PanelTab.contracts, tabName: 'swapContracts' },
      { tabKey: PanelTab.interface, tabName: 'interface' },
    ]

    if (!wordpressData?.wpVersion) {
      tabs.push({ tabKey: PanelTab.additions, tabName: 'buyPremium' })
    }
    if (chainId === STORAGE_NETWORK_ID) {
      tabs.push({ tabKey: PanelTab.migration, tabName: 'migration' })
    }
    if (admin?.toLowerCase() === account?.toLowerCase() && chainId === STORAGE_NETWORK_ID) {
      tabs.push({ tabKey: PanelTab.reset, tabName: 'reset' })
    }

    return tabs.map(({ tabKey, tabName }, i) => {
      return (
        <Tab key={i} active={tab === tabKey} onClick={() => setTab(tabKey)}>
          {t(tabName)}
        </Tab>
      )
    })
  }

  return (
    <Wrapper>
      <HeaderButtons>
        {appManagement && (
          <BackButton onClick={backToApp}>
            <MdArrowBack />
          </BackButton>
        )}
        <Wallet setPending={setPending} setError={setError} pending={pending} />
      </HeaderButtons>

      {account && (
        <NetworkInfo>
          <span className="row">
            <TextBlock type="positive">{t('descriptionAboutStorageNetworkUsage')}</TextBlock>
          </span>
          <strong className="row">
            {t('storageNetwork')}: <span>{STORAGE_NETWORK_NAME}</span>
          </strong>
          <div className="row">
            {accountPrefix ? `${accountPrefix}: ` : ' '}
            <span>{shortenAddress(account)}</span>
          </div>
        </NetworkInfo>
      )}

      {error && (
        <StyledError>
          {error?.code && `${error.code}: `}
          {error?.message}
        </StyledError>
      )}

      <Tabs>{returnTabs()}</Tabs>

      <Content>
        {tab === PanelTab.contracts && (
          <SwapContracts
            domain={domain}
            pending={pending}
            setPending={setPending}
            setError={setError}
            wrappedToken={wrappedToken}
            setTab={setTab}
          />
        )}
        {tab === PanelTab.interface && (
          <Interface
            pending={pending}
            activeNetworks={activeNetworks}
            setPending={setPending}
            setTab={setTab}
            switchToNetwork={switchToNetwork}
          />
        )}
        {tab === PanelTab.additions && <Additions switchToNetwork={switchToNetwork} pending={pending} />}
        {tab === PanelTab.migration && <Migration pending={pending} setPending={setPending} />}
        {tab === PanelTab.reset && <Reset setDomainDataTrigger={setDomainDataTrigger} />}
      </Content>
    </Wrapper>
  )
}
