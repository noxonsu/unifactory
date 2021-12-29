import React from 'react'
import { ZERO_ADDRESS } from 'sdk'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FaWallet } from 'react-icons/fa'
import networks from 'networks.json'
import { useDarkModeManager } from 'state/user/hooks'
import AppBody from './AppBody'
import Panel from './Panel'
import Web3Status from 'components/Web3Status'
import { colors } from 'theme'

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
  padding: 1.4rem;
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

const supportedNetworks = () => {
  return Object.values(networks).filter(
    (network) => network.registry && network.multicall && Boolean(network.wrappedToken?.address)
  )
}

const unavailableOrZeroAddr = (value: string | undefined) => !value || value === ZERO_ADDRESS

interface ComponentProps {
  domainData: any
  isAvailableNetwork: boolean
  setDomainDataTrigger: (x: any) => void
}

export default function Connection({ domainData, isAvailableNetwork, setDomainDataTrigger }: ComponentProps) {
  const { t } = useTranslation()
  const [darkMode] = useDarkModeManager()

  const needToConfigure =
    domainData &&
    (unavailableOrZeroAddr(domainData.admin) ||
      unavailableOrZeroAddr(domainData.factory) ||
      unavailableOrZeroAddr(domainData.router))

  const networks = supportedNetworks()

  return (
    <Wrapper>
      {!isAvailableNetwork ? (
        <AppBody>
          <SupportedNetworksWrapper>
            <h3>{t('youCanNotUseThisNetwork')}</h3>

            {networks.length && (
              <>
                <p>{t('availableNetworks')}</p>
                <SupportedNetworksList>
                  {networks.map((network: { name: string; chainId: number }, index) => {
                    const { name, chainId } = network

                    return (
                      <li key={chainId}>
                        {chainId} - {name}
                      </li>
                    )
                  })}
                </SupportedNetworksList>
              </>
            )}
          </SupportedNetworksWrapper>
        </AppBody>
      ) : needToConfigure ? (
        <AppBody>
          <Panel setDomainDataTrigger={setDomainDataTrigger} />
        </AppBody>
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
