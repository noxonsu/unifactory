import { useActiveWeb3React } from 'hooks'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { switchInjectedNetwork } from 'utils/wallet'
import { useAddPopup } from 'state/application/hooks'
import { updateAppOptions } from 'state/application/actions'
import { StorageState } from 'state/application/reducer'
import { useTransactionAdder } from 'state/transactions/hooks'
import AppBody from '../../pages/AppBody'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { ButtonSecondary, ButtonPrimary } from 'components/Button'
import { getCurrentDomain } from 'utils/app'
import { saveAppData } from 'utils/storage'
import { STORAGE_NETWORK_ID, STORAGE_NETWORK_NAME } from '../../constants'

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
`

const Title = styled.h1`
  font-size: 1.4rem;
  line-height: 1.6rem;
`

const ContentWrapper = styled.div`
  padding: 1rem;
`

const Text = styled.div<{ warning?: boolean }>`
  margin: 0.6rem 0;
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
  setDomainData: (data: StorageState | ((data: StorageState) => StorageState)) => void
}

export default function GreetingScreen({ setGreetingScreenIsActive, setDomainData }: ComponentProps) {
  const { account, deactivate, library } = useActiveWeb3React()
  const { connector, chainId } = useWeb3React()

  const dispatch = useDispatch()
  const [domain] = useState(getCurrentDomain())
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()

  const [onStorageNetwork, setOnStorageNetwork] = useState(false)

  useEffect(() => {
    setOnStorageNetwork(chainId === STORAGE_NETWORK_ID)
  }, [chainId])

  const switchToStorage = async () => {
    if (!connector) return

    try {
      if (connector instanceof InjectedConnector) {
        await switchInjectedNetwork(STORAGE_NETWORK_ID)
      } // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
      else if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
        connector.walletConnectProvider = undefined
      }
    } catch (error) {
      console.log(error)
    }
  }

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState('')

  const closeModal = () => setShowConfirm(false)
  const confirm = () => setShowConfirm(true)

  const saveDomainOwner = async () => {
    if (!account) return

    setAttemptingTxn(true)

    try {
      await saveAppData({
        //@ts-ignore
        library,
        owner: account || '',
        data: {},
        onReceipt: () => {
          setAttemptingTxn(false)
          dispatch(updateAppOptions([{ key: 'admin', value: account }]))
          setDomainData((oldData: StorageState) => ({ ...oldData, admin: account }))
          setGreetingScreenIsActive(false)
        },
        onHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `A new admin has been set`,
            }
          )
        },
      })
    } catch (error) {
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
      setAttemptingTxn(false)
    }
  }

  const disconnectWallet = () => {
    deactivate()
    setGreetingScreenIsActive(false)
  }

  const BottomContent = () => (
    <ButtonPrimary onClick={saveDomainOwner}>{t('saveThisAddressAsDomainOwner')}</ButtonPrimary>
  )

  return (
    <Wrapper>
      <AppBody>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={closeModal}
          attemptingTxn={attemptingTxn}
          pendingText={t('waitUntilYourAddressWillBeSaved')}
          hash={txHash || ''}
          content={() => (
            <ConfirmationModalContent
              title={t('setNewDomainAdmin')}
              onDismiss={closeModal}
              topContent={() => null}
              bottomContent={BottomContent}
            />
          )}
        />

        <ContentWrapper>
          <Text>
            <>
              <Title>{t('HelloLetsConnectThisDomain')}</Title>
              {t('setAddressAsTheOwnerOfDomain')}: <Span bold>{domain}</Span>?
            </>
            <Span block bold>
              {account}
            </Span>
            {t('onlyThisAddressCanAccessAppSettings')}.
          </Text>

          <Text warning>{t('IfYouWantToChangeTheAddressSwitchToAnotherAddress')}</Text>
          {!onStorageNetwork && <Text warning>{t('youHaveToBeOn', { network: STORAGE_NETWORK_NAME })}</Text>}

          <ButtonBlock>
            <ActionButton onClick={disconnectWallet}>{t('disconnect')}</ActionButton>
            {!onStorageNetwork ? (
              <ActionButton onClick={switchToStorage}>
                {t('switchToNetwork', { network: STORAGE_NETWORK_NAME })}
              </ActionButton>
            ) : (
              <ActionButton onClick={confirm}>{t('setTheOwner')}</ActionButton>
            )}
          </ButtonBlock>
        </ContentWrapper>
      </AppBody>
    </Wrapper>
  )
}
