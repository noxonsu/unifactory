import styled from 'styled-components'
import { ButtonEmpty } from 'components/Button'

export const StyledPurchaseButton = styled(ButtonEmpty)<{ width?: string; margin?: string }>`
  width: ${({ width }) => width || 'fit-content'};
  ${({ margin }) => (margin ? `margin: ${margin};` : '')}
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

export const StyledOnoutLink = styled.a`
  margin-left: 4px;
  font-size: 18px;
  text-decoration: none;
  color: ${({ theme }) => theme.blue2};
`
