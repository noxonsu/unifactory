import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { HuePicker } from 'react-color'
import InputPanel from 'components/InputPanel'
import { isValidColor } from '../../utils/color'

const SelectorWrapper = styled.div`
  padding: 0.3rem 0;
`

const ColorTop = styled.div`
  display: flex;
  margin-bottom: 0.6rem;
  align-items: center;
  justify-content: space-between;
`

const Label = styled.label`
  cursor: pointer;
  width: auto !important;
  display: flex;
  align-items: center;
`

const colorPickerStyles = {
  default: {
    picker: {
      width: '100%',
    },
  },
}

export default function ColorSelector({
  name,
  defaultColor,
  onColor,
}: {
  name: string
  defaultColor: string
  onColor: (color: string, valid: boolean) => void
}) {
  const { t } = useTranslation()
  const [color, setColor] = useState(defaultColor)
  const [customColor, setCustomColor] = useState(false)

  useEffect(() => {
    onColor(color, !color || isValidColor(color))
  }, [color, onColor])

  return (
    <SelectorWrapper>
      <ColorTop>
        <span>{name}</span>
        <Label>
          <input type="checkbox" name="use custom color" onChange={() => setCustomColor((prevState) => !prevState)} />{' '}
          {t('own')}
        </Label>
      </ColorTop>

      {customColor ? (
        <InputPanel label={`(rgb, hsl, hex)`} value={color} onChange={setColor} />
      ) : (
        <HuePicker
          color={color}
          onChangeComplete={(color: { hex: string }) => setColor(color.hex)}
          styles={colorPickerStyles}
        />
      )}
    </SelectorWrapper>
  )
}
