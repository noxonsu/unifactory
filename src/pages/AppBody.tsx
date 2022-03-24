import React from 'react'
import styled from 'styled-components'

export const BodyWrapper = styled.div`
  position: relative;
  max-width: 30rem;
  width: 100%;
  border-radius: 1.2rem;
  box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px, rgba(0, 0, 0, 0.04) 0px 16px 24px,
    rgba(0, 0, 0, 0.01) 0px 24px 32px;
  background-color: ${({ theme }) => theme.bg1};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 90%;
  `}
`

export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper>{children}</BodyWrapper>
}
