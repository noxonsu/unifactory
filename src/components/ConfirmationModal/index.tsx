import React from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

interface ComponentProps {
  isOpen: boolean
  onDismiss: () => void
  content: () => JSX.Element
}

export default function ConfirmationModal({ isOpen, onDismiss, content }: ComponentProps) {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={100}>
      <ModalContentWrapper>
        <AutoColumn gap="lg">
          <RowBetween style={{ padding: '0 2rem' }}>
            <div />
            <Text fontWeight={500} fontSize={20}>
              {t('areYouSure')}
            </Text>
            <StyledCloseIcon onClick={onDismiss} />
          </RowBetween>
          <Break />
          <AutoColumn gap="lg" style={{ padding: '0 2rem' }}>
            {content()}
          </AutoColumn>
        </AutoColumn>
      </ModalContentWrapper>
    </Modal>
  )
}
