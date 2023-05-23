import React, { FC, useState, useCallback, useEffect } from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import Big from 'big.js'
import { useAddPopup } from 'state/application/hooks'
import QuestionHelper from 'components/QuestionHelper'
import ConfirmationModal from '../ConfirmationModal'
import { StyledPurchaseButton } from '../styled'

const StyledNumList = styled.ol`
  padding: 0 0 0 1rem;

  li:not(:last-child) {
    margin-bottom: 0.4rem;
  }
`

const commonPluginStyle = css`
  padding: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

const StyledOption = styled.div<{ isPurchased?: boolean; isLocked?: boolean }>`
  padding: 8px;
  border-radius: 1.25rem;
  border: 1px solid
    ${({ theme, isPurchased, isLocked }) => {
      if (isLocked) return theme.primaryText1
      if (isPurchased) return theme.green2
      return theme.blue2
    }};

  ${({ isLocked }) => isLocked && 'opacity: 0.6;'}

  :not(:last-child) {
    margin-bottom: 8px;
  }
`

const StyledPurchase = styled.div`
  ${commonPluginStyle};
`

const StyledDescription = styled.div`
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-bottom: 14px;
    font-size: 20px;
  `}
`

const StyledText = styled.div`
  display: flex;
  margin-bottom: 12px;
`

const StyledLabel = styled.span`
  padding: 10px 14px;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.green1};
  background-color: ${({ theme }) => theme.green2};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
    text-align: center;
  `}
`

const StyledActivation = styled.div`
  ${commonPluginStyle};
  border-top: 1px solid ${({ theme }) => theme.bg3};

  .inputZone {
    display: flex;
    flex-direction: column;
  }
`

const ActivationInput = styled.input`
  margin: 12px 14px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.bg3};
  font-size: inherit;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin: 12px 0;
  `}
`

type Props = {
  name: JSX.Element
  description?: string
  notice?: string
  cryptoCost?: number
  assetName: string
  usdCost?: number
  isPurchased?: boolean
  isLocked?: boolean
  onPayment: () => Promise<void>
  onActivation: (key: string) => Promise<void>
  requiredKey: string
}

const AdditionBlock: FC<Props> = ({
  name,
  description,
  notice,
  cryptoCost,
  assetName,
  usdCost,
  isPurchased,
  isLocked,
  onPayment,
  onActivation,
  requiredKey,
}) => {
  const { t } = useTranslation()
  const addPopup = useAddPopup()

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTx, setAttemptingTx] = useState<boolean>(false)

  const onConfirm = () => setShowConfirm(true)

  const onDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const startPayment = async () => {
    setAttemptingTx(true)

    try {
      await onPayment()
    } catch (error) {
      console.group('%c Payment', 'color: red')
      console.error(error)
      console.groupEnd()
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    setAttemptingTx(false)
  }

  const [activationKey, setActivationKey] = useState('')
  const [isKeyValid, setIsKeyValid] = useState(activationKey === requiredKey)

  useEffect(() => {
    setIsKeyValid(activationKey === requiredKey)
  }, [activationKey, requiredKey])

  const activate = async () => {
    setAttemptingTx(true)
    await onActivation(activationKey)
    setAttemptingTx(false)
  }

  return (
    <StyledOption isPurchased={isPurchased} isLocked={isLocked}>
      <ConfirmationModal
        open={showConfirm}
        onDismiss={onDismissConfirmation}
        onDeployment={startPayment}
        txHash={txHash}
        attemptingTxn={attemptingTx}
        title={name}
        confirmBtnMessageId={'buy'}
        content={
          <div>
            {t('youBuyThisAddition')}. {t('youHaveToConfirmTheseTxs')}:
            <StyledNumList>
              <li>{t('confirmPaymentTransaction')}</li>
              <li>{t('saveYourAdditionKey')}</li>
            </StyledNumList>
          </div>
        }
      />

      <StyledPurchase>
        <StyledDescription>
          <StyledText>
            {name}
            {description && <QuestionHelper text={description} />}
          </StyledText>
          {notice && <StyledText>{notice}</StyledText>}
          <span>
            {typeof cryptoCost === 'number' ? (
              <b>
                {new Big(cryptoCost).toPrecision(6)} {assetName}
              </b>
            ) : (
              '...'
            )}{' '}
            {typeof usdCost === 'number' && <>(${usdCost})</>}
          </span>
        </StyledDescription>
        {isPurchased ? (
          <StyledLabel>{t('purchased')}</StyledLabel>
        ) : (
          <StyledPurchaseButton onClick={onConfirm} disabled={isLocked}>
            {t('buy')}
          </StyledPurchaseButton>
        )}
      </StyledPurchase>

      {!isPurchased && (
        <StyledActivation>
          <div className="inputZone">
            {t('useKeyForAdditionActivation')}:
            <ActivationInput
              placeholder="l1Wc9..."
              type="string"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setActivationKey(event.target.value)
              }}
            />
          </div>
          <StyledPurchaseButton onClick={activate} disabled={isLocked || !isKeyValid}>
            {attemptingTx ? '...' : t('activate')}
          </StyledPurchaseButton>
        </StyledActivation>
      )}
    </StyledOption>
  )
}

export default AdditionBlock
