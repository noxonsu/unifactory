import React, { useContext, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import useENS from 'hooks/useENS'
import { useActiveWeb3React } from 'hooks'
import { ExternalLink, TYPE } from 'theme'
import { getExplorerLink } from 'utils'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
  width: 100%;
`

const ContainerRow = styled.div<{ error: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.red1 : theme.bg3)};
  transition: border-color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')},
    color 500ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  background-color: ${({ theme }) => theme.bg1};
`

const InputContainer = styled.div`
  flex: 1;
  padding: 1rem;
`

const Input = styled.input<{ error?: boolean; disabled: boolean }>`
  font-size: 1.25rem;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: ${({ theme }) => theme.bg1};
  transition: color 300ms ${({ error }) => (error ? 'step-end' : 'step-start')};
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  width: 100%;

  ${({ disabled }) => (disabled ? 'opacity: 0.5' : '')};

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
  placeholder,
}: {
  id?: string
  label?: string | JSX.Element
  disabled?: boolean
  placeholder?: boolean | undefined
  value: string
  onChange: (value: string) => void
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const { address, loading, name } = useENS(value)

  const handleInput = useCallback(
    (event) => {
      const input = event.target.value
      const withoutSpaces = input.replace(/\s+/g, '')
      onChange(withoutSpaces)
    },
    [onChange]
  )

  const error = Boolean(value.length > 0 && !loading && !address)

  return (
    <InputPanel id={id}>
      <ContainerRow error={error}>
        <InputContainer>
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.black color={theme.text2} fontWeight={500} fontSize={14}>
                {label || 'Recipient'}
              </TYPE.black>
              {address && chainId && (
                <ExternalLink href={getExplorerLink(chainId, name ?? address, 'address')} style={{ fontSize: '14px' }}>
                  (View in Explorer)
                </ExternalLink>
              )}
            </RowBetween>
            <Input
              disabled={disabled}
              className="recipient-address-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder={placeholder ? 'Wallet Address or ENS name' : '...'}
              error={error}
              pattern="^(0x[a-fA-F0-9]{40})$"
              onChange={disabled ? () => {} : handleInput}
              value={value}
            />
          </AutoColumn>
        </InputContainer>
      </ContainerRow>
    </InputPanel>
  )
}
