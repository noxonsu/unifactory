import React, { useEffect, useState } from 'react'
import { useActiveWeb3React } from 'hooks'
import styled from 'styled-components'
import { MdArrowBack } from 'react-icons/md'
import { shortenAddress } from 'utils'
import { Text } from 'rebass'
import networks from '../../networks.json'
import Registry from 'contracts/build/Registry.json'
import { useDispatch, useSelector } from 'react-redux'
import { getContractInstance } from 'utils/contract'
import { AppState } from 'state'
import { useTranslation } from 'react-i18next'
import { useAppState } from 'state/application/hooks'
import { setAppManagement } from 'state/application/actions'
import { CleanButton, ButtonError, ButtonSecondary } from 'components/Button'
import ConfirmationModal from 'components/ConfirmationModal'
import Instruction from './Instruction'
import Wallet from './Wallet'
import SwapContracts from './SwapContracts'
import Interface from './Interface'

const Wrapper = styled.section`
  position: relative;
  max-width: 33.75rem;
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
  margin: 0.6rem;
  display: flex;
  justify-content: space-between;
`

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
`

const Tab = styled.button<{ active?: boolean }>`
  flex: 1;
  cursor: pointer;
  padding: 0.4rem 0.7rem;
  //margin: 0.1rem 0 0.4rem;
  font-size: 1em;
  border: none;
  background-color: ${({ theme, active }) => (active ? theme.bg2 : 'transparent')};
  color: ${({ theme }) => theme.text1};

  :first-child {
    border-top-left-radius: inherit;
    border-bottom-left-radius: inherit;
  }

  :last-child {
    border-top-right-radius: inherit;
    border-bottom-right-radius: inherit;
  }
`

const Content = styled.div`
  border-radius: 1rem;
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

const DangerZone = styled.div`
  margin-top: 1rem;
`

interface ComponentProps {
  setDomainDataTrigger: (x: any) => void
}

export default function Panel({ setDomainDataTrigger }: ComponentProps) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [pending, setPending] = useState<boolean>(false)
  const { chainId, account, library } = useActiveWeb3React()
  const { admin, factory, router } = useAppState()

  const [error, setError] = useState<any | false>(false)
  const [domain] = useState(window.location.hostname || document.location.host)

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

  const [tab, setTab] = useState('contracts')
  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  //@ts-ignore
  const accountPrefix = networks[chainId]?.name || t('account')

  const resetDomain = async () => {
    setShowConfirm(false)
    //@ts-ignore
    const registry: any = getContractInstance(library, networks[chainId]?.registry, Registry.abi)

    await registry.methods.removeDomain(domain).send({
      from: account,
    })
    setDomainDataTrigger((state: boolean) => !state)
  }

  const returnTabs = () => {
    return [
      { tabKey: 'contracts', tabName: 'swapContracts' },
      { tabKey: 'interface', tabName: 'interface' },
    ].map((info, index) => {
      return (
        <Tab key={index} active={tab === info.tabKey} onClick={() => setTab(info.tabKey)}>
          {t(info.tabName)}
        </Tab>
      )
    })
  }

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        content={() => (
          <>
            <Text fontWeight={500} fontSize={20}>
              {t('resetDomainDescription')}
            </Text>
            <ButtonError error padding={'12px'} onClick={resetDomain}>
              <Text fontSize={20} fontWeight={500} id="reset">
                {t('resetDomainData')}
              </Text>
            </ButtonError>
          </>
        )}
      />
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
          {accountPrefix ? `${accountPrefix}: ` : ' '}
          <span className="monospace">{shortenAddress(account)}</span>
        </NetworkInfo>
      )}

      <Instruction />

      {error && (
        <Error>
          {error?.code && error.code + ': '}
          {error?.message}
        </Error>
      )}

      <Tabs>{returnTabs()}</Tabs>

      <Content>
        {tab === 'contracts' && (
          <SwapContracts
            domain={domain}
            pending={pending}
            setPending={setPending}
            setError={setError}
            wrappedToken={wrappedToken}
            setDomainDataTrigger={setDomainDataTrigger}
          />
        )}
        {tab === 'interface' && (
          <Interface domain={domain} pending={pending} setPending={setPending} setError={setError} />
        )}
      </Content>

      {Boolean(admin && factory && router) && (
        <DangerZone>
          <ButtonSecondary onClick={() => setShowConfirm(true)}>{t('resetDomainData')}</ButtonSecondary>
        </DangerZone>
      )}
    </Wrapper>
  )
}
