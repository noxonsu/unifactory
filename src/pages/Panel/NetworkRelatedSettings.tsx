import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { OptionWrapper } from './index'
import Accordion from 'components/Accordion'

const NetworkItem = styled.div`
  border: 1px solid red;
`

const NetworkName = styled.h4``

const InputRow = styled.div`
  display: flex;
  align-items: center;
`

const Label = styled.label`
  display: flex;
  flex-direction: column;
`

const Input = styled.input``

export default function NetworkRelatedSettings(props: any) {
  const { activeNetworks } = props
  const { t } = useTranslation()

  return (
    <>
      {!!activeNetworks.length && (
        <Accordion title={t('swapFormDefaultCurrency')}>
          <OptionWrapper>
            {activeNetworks.map(({ name }: { name: string }, index: number) => {
              return (
                <NetworkItem key={index}>
                  <NetworkName>Network: {name}</NetworkName>

                  <InputRow>
                    <Label>
                      {t('inputToken')}:
                      <Input type="text" placeholder="0xb2s0..." />
                    </Label>
                    <Label>
                      {t('outputToken')}:
                      <Input type="text" placeholder="0xb2s0..." />
                    </Label>
                  </InputRow>
                </NetworkItem>
              )
            })}
          </OptionWrapper>
        </Accordion>
      )}
    </>
  )
}
