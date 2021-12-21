import React from 'react'
import styled from 'styled-components'
import Settings from '../Settings'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'

const StyledSwapHeader = styled.div`
  padding: 12px 0.9rem 0px 1.3rem;
  margin-bottom: 0.3rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader() {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <TYPE.black fontWeight={500}>Swap</TYPE.black>
        <Settings />
      </RowBetween>
    </StyledSwapHeader>
  )
}
