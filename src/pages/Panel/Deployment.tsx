import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useProjectInfo } from 'state/application/hooks'
import styled from 'styled-components'
import { Text } from 'rebass'
import networks from 'networks.json'
import { ButtonPrimary } from 'components/Button'
import QuestionHelper from 'components/QuestionHelper'
import InputPanel from 'components/InputPanel'
import AddressInputPanel from 'components/AddressInputPanel'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { deploySwapContracts, deployStorage, isValidAddress, returnTokenInfo } from 'utils/contract'

const Info = styled.p`
  margin: 0;
  padding: 0.3rem;
  font-size: 0.9rem;
  opacity: 0.7;
`

const Title = styled.h4`
  margin: 1.4em 0 0.8rem;
  font-weight: 500;
`

const Button = styled(ButtonPrimary)`
  font-size: 0.8em;
  margin-top: 0.3rem;
`

const InputWrapper = styled.div`
  margin: 0.2rem 0;
`

const Label = styled.div`
  display: flex;
  align-items: center;
`

export function Deployment(props: any) {
  const { pending, setError, wrappedToken, setWrappedToken, setDomainDataTrigger } = props
  const { t } = useTranslation()
  const { library, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const { admin: stateAdmin, factory: stateFactory, router: stateRouter } = useProjectInfo()

  enum DeployOption {
    Swap,
    Storage,
  }

  const [deployableOption, setDeployableOption] = useState<DeployOption | undefined>(undefined)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const [canDeploySwapContracts, setCanDeploySwapContracts] = useState(false)
  const [canDeployStorage, setCanDeployStorage] = useState(false)

  const currentDomain = window.location.hostname || document.location.host
  const [domain, setDomain] = useState(currentDomain)
  const [adminAddress, setAdminAddress] = useState(stateAdmin || '')

  const onContractsDeployment = async () => {
    setAttemptingTxn(true)

    try {
      //@ts-ignore
      const tokenInfo = await returnTokenInfo(library, wrappedToken)

      if (!tokenInfo) {
        return setError(new Error('It is not a wrapped token address. Double check it and try again.'))
      }

      await deploySwapContracts({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        library,
        admin: adminAddress,
        wrappedToken,
        onFactoryHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy factory`,
            }
          )
        },
        onRouterHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy router`,
            }
          )
          setAttemptingTxn(false)
        },
        onSuccessfulDeploy: () => setDomainDataTrigger((state: boolean) => !state),
      })
    } catch (error) {
      setError(error)
      setAttemptingTxn(false)
    }
  }

  const onStorageDeploy = async () => {
    setAttemptingTxn(true)

    try {
      await deployStorage({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        onHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy storage`,
            }
          )
          setAttemptingTxn(false)
        },
        library,
        admin: adminAddress,
      })
    } catch (error) {
      setError(error)
      setAttemptingTxn(false)
    }
  }

  useEffect(() => {
    setCanDeploySwapContracts(
      //@ts-ignore
      isValidAddress(library, adminAddress) &&
        wrappedToken &&
        //@ts-ignore
        isValidAddress(library, wrappedToken)
    )
  }, [library, adminAddress, wrappedToken])

  useEffect(() => {
    //@ts-ignore
    setCanDeployStorage(isValidAddress(library, adminAddress) && stateFactory && stateRouter)
  }, [library, adminAddress, stateFactory, stateRouter])

  const modalBottom = () => {
    const confirm = () => {
      if (deployableOption === DeployOption.Swap) onContractsDeployment()
      if (deployableOption === DeployOption.Storage) onStorageDeploy()
    }

    return (
      <div>
        <ButtonPrimary onClick={confirm}>
          <Text fontWeight={500} fontSize={20}>
            {t('confirmDeployment')}
          </Text>
        </ButtonPrimary>
      </div>
    )
  }

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        pendingText={''}
        content={() => (
          <ConfirmationModalContent
            title={
              deployableOption === DeployOption.Swap ? t('youAreDeployingSwapContracts') : t('youAreDeployingStorage')
            }
            onDismiss={handleDismissConfirmation}
            topContent={() => null}
            bottomContent={modalBottom}
          />
        )}
      />
      <InputWrapper>
        <AddressInputPanel label={`${t('admin')} *`} value={adminAddress} onChange={setAdminAddress} />
      </InputWrapper>
      <InputWrapper>
        <InputPanel label={`${t('domain')} *`} value={domain} onChange={setDomain} disabled />
      </InputWrapper>

      <Title>1) {t('deploySwapContracts')}</Title>

      <AddressInputPanel
        label={
          <Label>
            {t('wrappedToken')} * <QuestionHelper text={t('wrappedTokenDescription')} />
          </Label>
        }
        value={wrappedToken}
        onChange={setWrappedToken}
        disabled={
          // don't allow the user to change a token address
          // in case if we have it in our config
          //@ts-ignore
          networks[chainId]?.wrappedToken?.address && wrappedToken
        }
      />
      <Button
        onClick={() => {
          setDeployableOption(DeployOption.Swap)
          setShowConfirm(true)
        }}
        disabled={pending || !canDeploySwapContracts}
      >
        {t('deploySwapContracts')}
      </Button>

      <Title>2) {t('deployStorageContract')}</Title>
      <Info>{t('deployAfterSwapContracts')}</Info>
      <Button
        onClick={() => {
          setDeployableOption(DeployOption.Storage)
          setShowConfirm(true)
        }}
        disabled={pending || !canDeployStorage}
      >
        {t('deployStorage')}
      </Button>
    </>
  )
}
