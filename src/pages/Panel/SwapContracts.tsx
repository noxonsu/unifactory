import React, { useState, useEffect } from 'react'
import { useActiveWeb3React } from 'hooks'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import { useProjectInfo } from 'state/application/hooks'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ButtonPrimary } from 'components/Button'
import AddressInputPanel from 'components/AddressInputPanel'
import QuestionHelper from 'components/QuestionHelper'
import { isValidAddress, setFactoryOption, getFactoryOptions } from 'utils/contract'
import { ZERO_ADDRESS } from 'sdk'
import { factoryMethods } from '../../constants'

const Info = styled.p`
  padding: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.6;
`

const InputWrapper = styled.div`
  margin: 0.2rem 0;
`

const Button = styled(ButtonPrimary)`
  padding: 0.8rem;
  margin-top: 0.3rem;
  font-size: 0.8em;
`

const InputLabel = styled.div`
  display: flex;
  align-items: center;
`

export default function SwapContracts(props: any) {
  const { pending, setPending, setError } = props
  const { t } = useTranslation()
  const { library, account } = useActiveWeb3React()

  const { factory: stateFactory } = useProjectInfo()
  const [factory, setFactory] = useState(stateFactory || '')
  const [factoryIsCorrect, setFactoryIsCorrect] = useState(false)

  useEffect(() => {
    if (library) {
      setFactoryIsCorrect(isValidAddress(library, factory))
    }
  }, [library, factory])

  const [admin, setAdmin] = useState('')
  const [feeRecipient, setFeeRecipient] = useState('')
  const [allFeesToAdmin, setAllFeesToAdmin] = useState(false)

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  const fetchContractOptions = async () => {
    if (!library) return

    setPending(true)

    try {
      const options: any = await getFactoryOptions(library, factory)

      if (options) {
        const {
          // protocolFee,
          // totalFee,
          feeTo,
          feeToSetter,
          allFeeToProtocol,
        } = options

        setAdmin(feeToSetter)
        setFeeRecipient(feeTo === ZERO_ADDRESS ? '' : feeTo)
        setAllFeesToAdmin(allFeeToProtocol)
      }
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  const saveOption = async (method: string) => {
    let value

    switch (method) {
      case factoryMethods.setFeeToSetter:
        value = admin
        break
      case factoryMethods.setFeeTo:
        value = feeRecipient
        break
      case factoryMethods.setAllFeeToProtocol:
        value = allFeesToAdmin
        break
      default:
        value = ''
    }

    setPending(true)

    try {
      //@ts-ignore
      const receipt = await setFactoryOption(library, account, factory, method, value)

      console.log('receipt: ', receipt)
    } catch (error) {
      setError(error)
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <InputWrapper>
        <AddressInputPanel label={`${t('factoryAddress')} *`} value={factory} onChange={setFactory} />
      </InputWrapper>
      <Button
        onClick={fetchContractOptions}
        // pending={pending}
        disabled={!factoryIsCorrect || pending}
      >
        {t('fetchOptions')}
      </Button>
      <Info>{t('youCanUseTheSameAddressForBoothInputs')}</Info>

      <div className={`${!factoryIsCorrect || pending ? 'disabled' : ''}`}>
        <AddressInputPanel label={`${t('newAdmin')}`} value={admin} onChange={setAdmin} />
        <Button onClick={() => saveOption(factoryMethods.setFeeToSetter)} disabled={!admin}>
          {t('save')}
        </Button>

        <AddressInputPanel
          label={
            <InputLabel>
              {t('feeRecipient')} <QuestionHelper text={t('feeIsChargedWhen')} />
            </InputLabel>
          }
          value={feeRecipient}
          onChange={setFeeRecipient}
        />
        <Button onClick={() => saveOption(factoryMethods.setFeeTo)} disabled={!feeRecipient}>
          {t('save')}
        </Button>

        <Box>
          <Label>
            <Checkbox id="remember" name="remember" onChange={updateFeesToAdmin} />
            {t('allFeesToAdmin')}
          </Label>
        </Box>
        <Button onClick={() => saveOption(factoryMethods.setAllFeeToProtocol)} disabled={!factoryIsCorrect}>
          {t('save')}
        </Button>
      </div>
    </section>
  )
}
