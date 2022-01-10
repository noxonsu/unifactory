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
import { useProjectInfo } from 'state/application/hooks'
import { setAppManagement } from 'state/application/actions'
import { CleanButton, ButtonError, ButtonSecondary } from 'components/Button'
import ConfirmationModal from 'components/ConfirmationModal'
import Instruction from './Instruction'
import Wallet from './Wallet'
import Deployment from './Deployment'
import SwapContracts from './SwapContracts'
import Interface from './Interface'

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

const Tab = styled.button<{ active?: boolean }>`
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  margin: 0.2rem 0 0.4rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 1.1em;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme, active }) => (active ? theme.bg3 : 'transparent')};
  color: ${({ theme }) => theme.text1};

  &:not(:last-child) {
    margin-right: 1%;
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
  const { admin, factory, router } = useProjectInfo()
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
  const accountPrefix = networks[chainId]?.name || t('account')
  const domain = window.location.hostname || document.location.host

  const resetDomain = async () => {
    setShowConfirm(false)
    //@ts-ignore
    const registry: any = getContractInstance(library, networks[chainId]?.registry, Registry.abi)

    await registry.methods.removeDomain(domain).send({
      from: account,
    })

    setDomainDataTrigger((state: boolean) => !state)
  }

  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  const returnTabs = () => {
    return [
      { tabKey: 'deployment', tabName: 'deployment' },
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

      <p>* {t('requiredField')}</p>

      <Tabs>{returnTabs()}</Tabs>

      <Content>
        {tab === 'deployment' && (
          <Deployment
            pending={pending}
            error={error}
            setPending={setPending}
            setError={setError}
            wrappedToken={wrappedToken}
            setWrappedToken={setWrappedToken}
            setDomainDataTrigger={setDomainDataTrigger}
          />
        )}
        {tab === 'contracts' && <SwapContracts pending={pending} setPending={setPending} setError={setError} />}
        {tab === 'interface' && <Interface pending={pending} setPending={setPending} setError={setError} />}
      </Content>

      {Boolean(admin && factory && router) && (
        <DangerZone>
          <ButtonSecondary onClick={() => setShowConfirm(true)}>{t('resetDomainData')}</ButtonSecondary>
        </DangerZone>
      )}
    </Wrapper>
  )
}
