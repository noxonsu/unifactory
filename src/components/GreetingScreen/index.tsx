import { useActiveWeb3React } from 'hooks'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ButtonSecondary } from '../../components/Button'

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
  margin: 0 auto;
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
const Text = styled.p`
  font-size: 1.2rem;
  word-break: break-word;
`
const Span = styled.span`
  font-weight: 500;
`
const WrapperNoticeText = styled.div`
  border-left: 0.2rem solid #999;
  padding-left: 1rem;
`
const NoticeText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: #999;
`
const ButtonBlock = styled.div`
  display: flex;
`
const WalletAction = styled(ButtonSecondary)`
  font-weight: 400;
  margin-left: 8px;
  font-size: 0.825rem;
  padding: 6px;
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`
interface ComponentProps {
  setGreetingScreenActive: (x: any) => void
}

export default function GreetingScreen({ setGreetingScreenActive }: ComponentProps) {
  const { account, deactivate } = useActiveWeb3React()
  const [domain] = useState(window.location.hostname || document.location.host)
  const { t } = useTranslation()

  const WalletActionOneClick = () => {
    setGreetingScreenActive(true)
    localStorage.setItem('greetingScreenActive', 'false')
  }

  return (
    <Wrapper>
      <ContentWrapper>
        <Text>
          {t('HelloLetsConnectThisDomain')} <Span>{account}</Span> {t('AddressAsTheOwnerOf')} <Span>{domain}</Span>{' '}
          {t('ThenOnlyYouCanAccessAndChangeTheSettingsOfTheApp')}
        </Text>
        <WrapperNoticeText>
          <NoticeText>{t('IfYouWantToChangeTheAddressSwitchToAnotherAddress')}</NoticeText>
        </WrapperNoticeText>
        <ButtonBlock>
          <WalletAction
            style={{ fontSize: '.825rem', fontWeight: 400, marginRight: '8px' }}
            onClick={() => {
              deactivate()
              WalletActionOneClick()
            }}
          >
            {t('disconnect')}
          </WalletAction>
          <WalletAction
            style={{ fontSize: '.825rem', fontWeight: 400, marginRight: '8px' }}
            onClick={() => {
              WalletActionOneClick()
            }}
          >
            {t('SetMyAddressAsTheOwner')}
          </WalletAction>
        </ButtonBlock>
      </ContentWrapper>
    </Wrapper>
  )
}
