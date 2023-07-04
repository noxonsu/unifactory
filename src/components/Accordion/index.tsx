import React, { useState } from 'react'
import styled from 'styled-components'
import { CleanButton } from 'components/Button'
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from 'react-icons/md'

const Wrapper = styled.div<{ margin?: string; minimalStyles?: boolean; padding: number; borderRadius: number }>`
  ${({ minimalStyles, padding, margin, borderRadius, theme }) =>
    minimalStyles
      ? ``
      : `
    ${margin ? `margin: ${margin};` : ''}
    padding: ${padding}rem ${padding * 1.6}rem;
    border-radius: ${borderRadius}rem;
    border: 1px solid ${theme.bg3};
    background-color: ${theme.bg2};
  `}
`

const Header = styled(CleanButton)`
  padding: 0.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h4`
  font-weight: 400;
  margin: 0;
`

const ArrowWrapper = styled.div`
  padding: 0.3rem;
`

const Content = styled.div<{ hidden: boolean; padding: boolean }>`
  ${({ padding }) => (padding ? `padding: inherit` : '')}

  ${({ hidden }) =>
    hidden
      ? `
      pointer-events: none;
      position: absolute;
      opacity: 0;
    `
      : ''}
`

export default function Accordion({
  title,
  children,
  padding = 0.4,
  margin,
  borderRadius = 1.25,
  contentPadding = false,
  minimalStyles,
  openByDefault,
  className,
}: {
  title: string
  children: JSX.Element | JSX.Element[]
  padding?: number
  margin?: string
  borderRadius?: number
  contentPadding?: boolean
  minimalStyles?: boolean
  openByDefault?: boolean
  className?: string
}) {
  const [open, setOpen] = useState<boolean>(openByDefault ?? false)

  return (
    <Wrapper
      padding={padding}
      margin={margin}
      borderRadius={borderRadius}
      minimalStyles={minimalStyles}
      className={className}
    >
      <Header onClick={() => setOpen(!open)}>
        <Title>{title}</Title>
        <ArrowWrapper>{open ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}</ArrowWrapper>
      </Header>

      <Content hidden={!open} padding={minimalStyles ? false : contentPadding}>
        {children}
      </Content>
    </Wrapper>
  )
}
