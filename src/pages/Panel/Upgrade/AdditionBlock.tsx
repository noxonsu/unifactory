import React, { FC, useState, useCallback } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useAddPopup } from 'state/application/hooks'
import { ButtonEmpty } from 'components/Button'
import ConfirmationModal from '../ConfirmationModal'
import QuestionHelper from 'components/QuestionHelper'

const StyledNumList = styled.ol`
  padding: 0 0 0 1rem;

  li:not(:last-child) {
    margin-bottom: 0.4rem;
  }
`

const StyledOption = styled.div<{ isPurchased?: boolean }>`
  padding: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme, isPurchased }) => (isPurchased ? theme.green2 : theme.blue2)};

  :not(:last-child) {
    margin-bottom: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
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

const StyledButton = styled(ButtonEmpty)`
  width: fit-content;
  padding: 12px 7%;
  background-color: ${({ theme }) => theme.blue2};
  color: ${({ theme }) => theme.white1};
  transition: 120ms;

  :hover {
    opacity: 0.7;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `}
`

type Props = {
  name: string
  description?: string
  cryptoCost?: number
  assetName: string
  usdCost?: number
  isPurchased: boolean | undefined
  onPayment: () => void
}

const AdditionBlock: FC<Props> = ({ name, description, cryptoCost, assetName, usdCost, isPurchased, onPayment }) => {
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

  return (
    <StyledOption isPurchased={isPurchased}>
      <ConfirmationModal
        open={showConfirm}
        onDismiss={onDismissConfirmation}
        onDeployment={startPayment}
        txHash={txHash}
        attemptingTxn={attemptingTx}
        titleId={name}
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

      <StyledDescription>
        <StyledText>
          {name}
          {description && <QuestionHelper text={description} />}
        </StyledText>
        <span>
          {typeof cryptoCost === 'number' && (
            <span>
              {cryptoCost} {assetName}
            </span>
          )}{' '}
          {typeof usdCost === 'number' && <>(${usdCost})</>}
        </span>
      </StyledDescription>
      {isPurchased ? (
        <StyledLabel>{t('purchased')}</StyledLabel>
      ) : (
        <StyledButton onClick={onConfirm}>{t('buy')}</StyledButton>
      )}
    </StyledOption>
  )
}

export default AdditionBlock
