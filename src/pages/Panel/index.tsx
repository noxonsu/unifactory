import React, { useEffect, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { MdArrowBack } from 'react-icons/md'
import { shortenAddress } from 'utils'
import networks from '../../networks.json'
import { useDispatch, useSelector } from 'react-redux'
import { AppState } from 'state'
import { useTranslation } from 'react-i18next'
import { setAppManagement } from 'state/application/actions'
import { CleanButton } from 'components/Button'
import { Wallet } from './components/Wallet'
import { Deployment } from './components/Deployment'
import { SwapContracts } from './components/SwapContracts'
import { InterfaceOptions } from './components/InterfaceOptions'

const Wrapper = styled.section`
  padding: 1rem;
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
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
`

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const Tab = styled.button`
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  margin: 0.2rem 0 0.4rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 0.9em;
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text1};

  &:not(:last-child) {
    margin-right: 1%;
  }
`

const Content = styled.div`
  border-radius: 1rem;
  border: 1px solid #00000005;
`

const Error = styled.span`
  display: inline-block;
  width: 100%;
  margin: 0.6rem 0 0.2rem;
  padding: 0.4rem;
  overflow-x: auto;
  border-radius: 0.4rem;
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.red1};
`

export default function Panel() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [pending, setPending] = useState<boolean>(false)
  const { chainId, account } = useActiveWeb3React()
  const [error, setError] = useState<any | false>(false)

  const appManagement = useSelector<AppState, AppState['application']['appManagement']>(
    (state) => state.application.appManagement
  )

  const [wrappedToken, setWrappedToken] = useState('')

  useEffect(() => {
    if (chainId) {
      //@ts-ignore
      setWrappedToken(networks[chainId].wrappedToken.address)
    }
  }, [chainId])

  const backToApp = () => {
    dispatch(setAppManagement({ status: false }))
  }

  const [tab, setTab] = useState('deployment')

  //@ts-ignore
  const accountPrefix = networks[chainId] ? networks[chainId]?.name || t('account') : ''

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

      <NetworkInfo>
        {accountPrefix ? `${accountPrefix}: ` : ' '}
        <span className="monospace">{shortenAddress(account || '')}</span>
      </NetworkInfo>

      {error && (
        <Error>
          {error?.code && error.code + ': '}
          {error?.message}
        </Error>
      )}

      <p>* {t('requiredField')}</p>

      <Tabs>
        <Tab onClick={() => setTab('deployment')}>{t('deployment')}</Tab>
        <Tab onClick={() => setTab('contracts')}>{t('swapContracts')}</Tab>
        <Tab onClick={() => setTab('interface')}>{t('interfaceOptions')}</Tab>
      </Tabs>

      <Content>
        {tab === 'deployment' && (
          <Deployment
            pending={pending}
            error={error}
            setPending={setPending}
            setError={setError}
            wrappedToken={wrappedToken}
            setWrappedToken={setWrappedToken}
          />
        )}
        {tab === 'contracts' && <SwapContracts pending={pending} setPending={setPending} setError={setError} />}
        {tab === 'interface' && <InterfaceOptions pending={pending} setPending={setPending} setError={setError} />}
      </Content>
    </Wrapper>
  )
}
