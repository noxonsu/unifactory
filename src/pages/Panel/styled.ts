import styled from 'styled-components'
import { ButtonEmpty } from 'components/Button'

export const StyledPurchaseButton = styled(ButtonEmpty)<{ width?: string }>`
  width: ${({ width }) => width || 'fit-content'};
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
