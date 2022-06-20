import { useActiveWeb3React } from 'hooks'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import AppBody from '../../pages/AppBody'
import { ButtonSecondary } from 'components/Button'
import { getCurrentDomain } from 'utils/app'

const Wrapper = styled.section`
  position: absolute;
  height: 100%;
  width: 100%;
  padding: 6vh 0 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  background-color: ${({ theme }) => theme.bg2};
`

const ContentWrapper = styled.div`
  padding: 1rem;
`

const Text = styled.p<{ warning?: boolean }>`
  font-size: 1.2rem;
  line-height: 1.5rem;
  word-break: break-word;
  ${({ warning, theme }) =>
    warning ? `padding: .6rem; border-radius: .3rem; background-color: ${theme.yellow1};` : ''}

  :first-child {
    margin-top: 0;
  }
`

const Span = styled.span<{ block?: boolean; bold?: boolean }>`
  ${({ block }) =>
    block
      ? `
    display: block;
    margin: 0.7rem 0;
  `
      : ''}
  ${({ bold }) => (bold ? 'font-weight: 500' : '')}
`

const ButtonBlock = styled.div`
  display: flex;
`

const ActionButton = styled(ButtonSecondary)`
  font-size: 0.9rem;
  padding: 0.5rem;

  :not(:last-child) {
    margin-right: 0.5rem;
  }

  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

interface ComponentProps {
  setGreetingScreenIsActive: (state: boolean) => void
}

export default function GreetingScreen({ setGreetingScreenIsActive }: ComponentProps) {
  const { account, deactivate } = useActiveWeb3React()
  const [domain] = useState(getCurrentDomain())
  const { t } = useTranslation()

  const closeScreen = () => setGreetingScreenIsActive(false)

  const disconnectWallet = () => {
    deactivate()
    closeScreen()
  }

  return (
    <Wrapper>
      <AppBody>
        <ContentWrapper>
          <Text>
            <>
              {t('HelloLetsConnectThisDomain')}. {t('setAddressAsTheOwnerOfDomain')}: <Span bold>{domain}</Span>?
            </>
            <Span block bold>
              {account}
            </Span>
            {t('onlyThisAddressCanAccessAppSettings')}.
          </Text>
          <Text warning>{t('IfYouWantToChangeTheAddressSwitchToAnotherAddress')}</Text>
          <ButtonBlock>
            <ActionButton onClick={disconnectWallet}>{t('disconnect')}</ActionButton>
            <ActionButton onClick={closeScreen}>{t('setTheOwner')}</ActionButton>
          </ButtonBlock>
        </ContentWrapper>
      </AppBody>
    </Wrapper>
  )
}
