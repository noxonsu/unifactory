import React from 'react'
import styled from 'styled-components'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  padding: 0.35rem 0.6rem;
  border-radius: 0.875rem;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.primary1 : theme.text5) : 'none')};
  color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text2)};
  font-size: 1rem;
  font-weight: ${({ isOnSwitch }) => (isOnSwitch ? '500' : '400')};
  transition: 0.1s;

  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? theme.primary1 : theme.text3) : 'none'};
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 0.875rem;
  border: 1px solid ${({ theme }) => theme.bg4};
  background-color: transparent;
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} isOnSwitch={true}>
        On
      </ToggleElement>
      <ToggleElement isActive={!isActive} isOnSwitch={false}>
        Off
      </ToggleElement>
    </StyledToggle>
  )
}
