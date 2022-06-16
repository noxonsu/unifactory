import React, { useEffect, useState } from 'react'
import { ZERO_ADDRESS } from 'sdk'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FaWallet } from 'react-icons/fa'
import { useWeb3React } from '@web3-react/core'
import networks from 'networks.json'
import { SUPPORTED_NETWORKS } from 'connectors'
import AppBody from './AppBody'
import Panel from './Panel'
import Web3Status from 'components/Web3Status'
import { AppDispatch } from 'state'
import { ApplicationModal, setOpenModal } from '../state/application/actions'
import { useAppState } from 'state/application/hooks'
import { useDispatch } from 'react-redux'
import useWordpressInfo from 'hooks/useWordpressInfo'

const Wrapper = styled.section`
  width: 100%;
  padding: 6vh 0 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
`

const ContentWrapper = styled.div`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 1.8rem;
`

const WalletIconWrapper = styled.div`
  padding: 0.6rem;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.text2};

  .icon {
    color: ${({ theme }) => theme.bg1};
  }
`

const Title = styled.h3`
  margin: 1.6rem 0;
  text-align: center;
  font-weight: 500;
`

const SubTitle = styled.h4`
  margin: 0.2rem 0;
  padding: 0.2rem 0;
  font-weight: 400;
`

const NetworkRow = styled.p`
  margin: 0;
  padding: 0.2rem 0;
`

const NetworkStatus = styled.div`
  width: 80%;
`

const SupportedNetworksWrapper = styled.div`
  padding: 0.7rem 1.4rem;
`

const SupportedNetworksList = styled.ul`
  margin: 0;
  padding: 0.6rem 0;
  list-style: none;

  li {
    margin: 0.4rem 0;
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;
    background-color: ${({ theme }) => theme.bg2};
  }
`

const unavailableOrZeroAddr = (value: string | undefined) => !value || value === ZERO_ADDRESS

interface ComponentProps {
  domainData: any
  isAvailableNetwork: boolean
  setDomainDataTrigger: (x: any) => void
}

export default function Connection({ domainData, isAvailableNetwork, setDomainDataTrigger }: ComponentProps) {
  const { active, chainId, account } = useWeb3React()
  const wordpressData = useWordpressInfo()
  const { t } = useTranslation()
  const dispatch = useDispatch<AppDispatch>()
  const { admin, factory, router } = useAppState()
  const [needToConfigure, setNeedToConfigure] = useState(false)

  useEffect(() => {
    if (
      active &&
      (!domainData || unavailableOrZeroAddr(admin) || unavailableOrZeroAddr(factory) || unavailableOrZeroAddr(router))
    ) {
      setNeedToConfigure(true)
    }
  }, [active, admin, factory, router, domainData])

  useEffect(() => {
    if (isAvailableNetwork && !needToConfigure) {
      dispatch(setOpenModal(ApplicationModal.WALLET))
    }
  }, [dispatch, isAvailableNetwork, needToConfigure])

  const [changeAllowed, setChangeAllowed] = useState(false)

  useEffect(() => {
    setChangeAllowed(
      wordpressData?.wpAdmin
        ? wordpressData.wpAdmin.toLowerCase() === account?.toLowerCase()
        : admin && admin !== ZERO_ADDRESS
        ? admin.toLowerCase() === account?.toLowerCase()
        : true
    )
  }, [needToConfigure, wordpressData, account, admin])

  return (
    <Wrapper>
      {!isAvailableNetwork ? (
        <AppBody>
          <SupportedNetworksWrapper>
            {chainId && wordpressData?.wpNetworkIds?.length && !wordpressData.wpNetworkIds.includes(chainId) ? (
              <>
                <h3>{t('youCanNotUseThisNetwork')}</h3>
                <div>
                  <SubTitle>
                    {wordpressData.wpNetworkIds.length > 1
                      ? t('pleaseSelectOneOfTheFollowingNetworks')
                      : t('pleaseSelectTheFollowingNetwork')}
                    :
                  </SubTitle>
                  {wordpressData.wpNetworkIds.map((id) =>
                    !!id ? (
                      <NetworkRow key={id}>
                        {/* @ts-ignore */}
                        {networks[id]?.name} (ID: {networks[id]?.chainId})
                      </NetworkRow>
                    ) : null
                  )}
                </div>
              </>
            ) : (
              <>
                <h3>{t('youCanNotUseThisNetwork')}</h3>
                {SUPPORTED_NETWORKS.length && (
                  <>
                    <p>{t('availableNetworks')}</p>
                    <SupportedNetworksList>
                      {Object.values(SUPPORTED_NETWORKS).map(({ name, chainId }) => (
                        <li key={chainId}>
                          {chainId} - {name}
                        </li>
                      ))}
                    </SupportedNetworksList>
                  </>
                )}
              </>
            )}
          </SupportedNetworksWrapper>
        </AppBody>
      ) : needToConfigure ? (
        <>
          {changeAllowed ? (
            <Panel setDomainDataTrigger={setDomainDataTrigger} />
          ) : (
            <AppBody>
              <SupportedNetworksWrapper>
                <h3>{t('appIsNotReadyYet')}</h3>
              </SupportedNetworksWrapper>
            </AppBody>
          )}
        </>
      ) : (
        <AppBody>
          <ContentWrapper>
            <WalletIconWrapper>
              <FaWallet size="2.4rem" className="icon" />
            </WalletIconWrapper>
            <Title>{t('toGetStartedConnectWallet')}</Title>
            <NetworkStatus>
              <Web3Status />
            </NetworkStatus>
          </ContentWrapper>
        </AppBody>
      )}
    </Wrapper>
  )
}
