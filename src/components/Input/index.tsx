import React, { useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  z-index: 1;
  width: 100%;
`

const Label = styled.div`
  font-size: 1.1em;
  margin: 0.2rem 0;
  padding: 0.2rem 0;
`

const ContainerRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  transition: border-color 300ms step-start, color 500ms step-start;
  background-color: ${({ theme }) => theme.bg1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 0.6rem;
`

const Input = styled.input<{ disabled: boolean }>`
  font-size: 1.15rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.bg1};
  transition: color 300ms step-start;
  color: ${({ theme }) => theme.text1};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;
  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
  padding: 0px;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

export default function AddressInputPanel({
  id,
  label,
  disabled = false,
  value,
  onChange,
}: {
  id?: string
  label?: string
  disabled?: boolean
  value: string
  onChange: (value: string) => void
}) {
  const theme = useContext(ThemeContext)

  const handleInput = useCallback(
    (event) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  return (
    <InputPanel id={id}>
      {label && (
        <Label>
          <TYPE.black color={theme.text2} fontWeight={500} fontSize={14}>
            {label}
          </TYPE.black>
        </Label>
      )}
      <ContainerRow>
        <InputContainer>
          <AutoColumn gap="md">
            <Input
              disabled={disabled}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="..."
              onChange={disabled ? () => {} : handleInput}
              value={value}
            />
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
