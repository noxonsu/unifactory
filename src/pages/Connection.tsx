import React, { useEffect, useState } from 'react'
import { ZERO_ADDRESS } from 'sdk'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FaWallet } from 'react-icons/fa'
import { useWeb3React } from '@web3-react/core'
import networks from 'networks.json'
import { SUPPORTED_NETWORKS } from 'connectors'
import { useDarkModeManager } from 'state/user/hooks'
import AppBody from './AppBody'
import Panel from './Panel'
import { colors } from 'theme'
import Web3Status from 'components/Web3Status'
import { ApplicationModal, setOpenModal } from '../state/application/actions'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'state'
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
`

const Title = styled.h4`
  margin: 1.6rem 0;
  text-align: center;
  font-weight: 500;
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

const supportedNetworks = (): { chainId: string; name: string }[] =>
  Object.keys(SUPPORTED_NETWORKS).map((chainId) => ({
    chainId,
    //@ts-ignore
    name: networks[chainId].name,
  }))

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
  const [darkMode] = useDarkModeManager()
  const dispatch = useDispatch<AppDispatch>()
  const [needToConfigure, setNeedToConfigure] = useState(false)

  useEffect(() => {
    if (
      active &&
      (!domainData ||
        unavailableOrZeroAddr(domainData.admin) ||
        unavailableOrZeroAddr(domainData.factory) ||
        unavailableOrZeroAddr(domainData.router))
    ) {
      setNeedToConfigure(true)
    }
  }, [active, domainData])

  useEffect(() => {
    if (isAvailableNetwork && !needToConfigure) {
      dispatch(setOpenModal(ApplicationModal.WALLET))
    }
  }, [dispatch, isAvailableNetwork, needToConfigure])

  const [changeAllowed, setChangeAllowed] = useState(false)

  useEffect(() => {
    if (needToConfigure) {
      setChangeAllowed(wordpressData?.wpAdmin ? wordpressData.wpAdmin.toLowerCase() === account?.toLowerCase() : true)
    }
  }, [needToConfigure, wordpressData, account])

  const supported = supportedNetworks()

  return (
    <Wrapper>
      {!isAvailableNetwork ? (
        <AppBody>
          <SupportedNetworksWrapper>
            {wordpressData?.wpNetworkId && wordpressData.wpNetworkId !== chainId ? (
              <>
                <h3>{t('youCanNotUseThisNetwork')}</h3>
                <p>
                  {t('pleaseSelectTheFollowingNetwork')}: {/* @ts-ignore */}
                  {networks[wordpressData?.wpNetworkId]?.name} (id: {networks[wordpressData?.wpNetworkId]?.chainId})
                </p>
              </>
            ) : (
              <>
                <h3>{t('youCanNotUseThisNetwork')}</h3>
                {supported.length && (
                  <>
                    <p>{t('availableNetworks')}</p>
                    <SupportedNetworksList>
                      {supported.map(({ name, chainId }) => (
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
              <FaWallet size="2.4rem" color={colors(darkMode).bg1} />
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
