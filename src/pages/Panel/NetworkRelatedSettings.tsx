import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import { OptionWrapper } from './index'
import Accordion from 'components/Accordion'
import TextBlock from 'components/TextBlock'

const InputRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`

const Label = styled.label`
  display: flex;
  flex-direction: column;

  :not(:last-child) {
    margin-right: 2%;
  }
`

const Input = styled.input`
  font-family: inherit;
  font-size: inherit;
  color: inherit;
`

export default function NetworkRelatedSettings(props: any) {
  const { onInputCurrency, onOutputCurrency } = props
  const { chainId } = useActiveWeb3React()
  const { t } = useTranslation()
  const { defaultSwapCurrency } = useAppState()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (chainId) {
      setInput(defaultSwapCurrency.input || '')
      setOutput(defaultSwapCurrency.output || '')
    }
  }, [chainId, defaultSwapCurrency.input, defaultSwapCurrency.output])

  return (
    <>
      <Accordion title={t('swapFormDefaultCurrency')}>
        <TextBlock type="warning">{t('itWillNotWorkIfYouPasteWrongAddress')}</TextBlock>

        <OptionWrapper>
          <InputRow>
            <Label>
              {t('inputToken')}:
              <Input
                type="text"
                placeholder="0x..."
                defaultValue={input}
                onChange={(event) => onInputCurrency(event.target.value)}
              />
            </Label>
            <Label>
              {t('outputToken')}:
              <Input
                type="text"
                placeholder="0x..."
                defaultValue={output}
                onChange={(event) => onOutputCurrency(event.target.value)}
              />
            </Label>
          </InputRow>
        </OptionWrapper>
      </Accordion>
    </>
  )
}
