import React, { useContext } from 'react'
import { VscError } from 'react-icons/vsc'
import styled, { ThemeContext } from 'styled-components'
import { TYPE } from 'theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

const IconWrapper = styled.div`
  width: 3.7rem;
  padding-right: 1rem;
`

export default function ErrorPopup({ message, code }: { message: string; code?: number | string }) {
  const theme = useContext(ThemeContext)

  return (
    <RowNoFlex>
      <IconWrapper>
        <VscError color={theme.red1} size="100%" />
      </IconWrapper>
      <AutoColumn gap="8px">
        {code && `Code: ${code}`}
        <TYPE.body fontWeight={500}>{message}</TYPE.body>
      </AutoColumn>
    </RowNoFlex>
  )
}
