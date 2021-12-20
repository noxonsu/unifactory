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
  margin-bottom: 0.4rem;
`

const NetworkStatus = styled.div`
  width: 80%;
`

const SupportedNetworksWrapper = styled.div`
  padding: 1.4rem;
`

const supportedChainIds = () => {
  return Object.values(networks).filter(
    (network) => network.registry && network.multicall && Boolean(network.wrappedToken?.address)
  )
}

const unavailableOrZeroAddr = (value: string | undefined) => !value || value === ZERO_ADDRESS

export default function Connection({ domainData, isAvailableNetwork }: any) {
  const { t } = useTranslation()
  const [darkMode] = useDarkModeManager()

  const needToConfigure =
    domainData &&
    (unavailableOrZeroAddr(domainData.admin) ||
      unavailableOrZeroAddr(domainData.factory) ||
      unavailableOrZeroAddr(domainData.router))

  const availableNetworks = supportedChainIds()

  return (
    <Wrapper>
      {!isAvailableNetwork ? (
        <AppBody>
          <SupportedNetworksWrapper>
            <h3>{t('youCanNotUseThisNetwork')}</h3>

            {availableNetworks.length && (
              <>
                <p>{t('availableNetworks')}</p>
                <ul>
                  {availableNetworks.map((network: { name: string; chainId: number }, index) => {
                    const { name, chainId } = network

                    return (
                      <li key={chainId}>
                        {chainId} - {name}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </SupportedNetworksWrapper>
        </AppBody>
      ) : needToConfigure ? (
        <AppBody>
          <Panel />
        </AppBody>
      ) : (
        <AppBody>
          <ContentWrapper>
            <WalletIconWrapper>
              <FaWallet size="2rem" color={colors(darkMode).bg1} />
            </WalletIconWrapper>

            <Title>{t('connectWallet')}</Title>
            <p>{t('toGetStartedConnectWallet')}</p>

            <NetworkStatus>
              <Web3Status />
            </NetworkStatus>
          </ContentWrapper>
        </AppBody>
      )}
    </Wrapper>
  )
}
