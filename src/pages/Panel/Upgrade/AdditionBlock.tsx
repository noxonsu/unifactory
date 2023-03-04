import React, { FC } from 'react'
import styled from 'styled-components'
import TextBlock from 'components/TextBlock'
import { ButtonPrimary } from 'components/Button'
import QuestionHelper from 'components/QuestionHelper'

const StyledOption = styled.div`
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
`

type Props = {
  name: string
  description?: string
  cryptoCost: number
  usdCost: number
  onBuy: VoidFunction
}

const AdditionBlock: FC<Props> = ({ name, description, cryptoCost, usdCost, onBuy }) => {
  return (
    <StyledOption>
      <>
        <TextBlock>
          {name}
          {description && <QuestionHelper text={description} />}
        </TextBlock>
        <span>
          Crypto: {cryptoCost}; USD: {usdCost}
        </span>
      </>
      <ButtonPrimary onClick={onBuy}>Buy</ButtonPrimary>
    </StyledOption>
  )
}

export default AdditionBlock
