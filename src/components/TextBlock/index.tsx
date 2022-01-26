import React from 'react'
import styled from 'styled-components'

const Info = styled.div<{ flex?: boolean; warning?: boolean }>`
  margin: 0.2rem 0;
  padding: 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  opacity: 0.6;

  ${({ flex }) => (flex ? 'display: flex; align-items: center;' : '')}
  ${({ warning, theme }) => (warning ? `background-color: ${theme.yellow1}; opacity: 1;` : '')}
`

export default function TextBlock({ children, flex, warning }: { children: any; flex?: boolean; warning?: boolean }) {
  return (
    <Info flex={flex} warning={warning}>
      {children}
    </Info>
  )
}
