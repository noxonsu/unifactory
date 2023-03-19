import React, { ReactNode } from 'react'
import styled, { css } from 'styled-components'

type ContentType = 'warning' | 'positive' | 'notice' | 'negative'

const Info = styled.div<{ flex?: boolean; type?: ContentType }>`
  margin: 0.2rem 0;
  padding: 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  opacity: 0.6;
  border: 1px solid transparent;
  width: 100%;

  ${({ flex }) => (flex ? 'display: flex; align-items: center;' : '')}
  ${({ type, theme }) => {
    if (type === 'notice')
      return css`
        background-color: ${theme.blue2Soft};
        border-color: ${theme.blue2};
        opacity: 1;
      `
    if (type === 'warning')
      return css`
        background-color: ${theme.yellow1};
        border-color: ${theme.yellow3};
        opacity: 1;
      `
    if (type === 'positive')
      return css`
        background-color: ${theme.green1Soft};
        border-color: ${theme.green1};
        opacity: 1;
      `
    if (type === 'negative')
      return css`
        background-color: ${theme.red1Soft};
        border-color: ${theme.red1};
        opacity: 1;
      `
    return ''
  }}
`

export default function TextBlock({
  children,
  flex,
  type,
}: {
  children: ReactNode
  flex?: boolean
  type?: ContentType
}) {
  return (
    <Info flex={flex} type={type}>
      {children}
    </Info>
  )
}
