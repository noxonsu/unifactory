import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import { useActiveWeb3React } from 'hooks'
import { useProjectInfo } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useTranslation } from 'react-i18next'
import { ButtonPrimary } from 'components/Button'
import Accordion from 'components/Accordion'
import AddressInputPanel from 'components/AddressInputPanel'
import QuestionHelper from 'components/QuestionHelper'
import InputPanel from 'components/InputPanel'
import { isValidAddress, setFactoryOption, getFactoryOptions } from 'utils/contract'
import { ZERO_ADDRESS } from 'sdk'
import { factoryMethods } from '../../constants'

const OptionWrapper = styled.div<{ margin?: number }>`
  margin: ${({ margin }) => margin || 0.2}rem 0;
  padding: 0.3rem 0;
`

const Info = styled.div`
  margin: 0.2rem 0;
  padding: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.6;
`

const List = styled.ul`
  padding: 0;
  padding-left: 1rem;

  li:not(:last-child) {
    margin-bottom: 0.4rem;
  }
`

const LabelExtended = styled(Label)`
  display: flex;
  align-items: center;
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

enum Representations {
  contract,
  interface,
}

const TOTAL_FEE_RATIO = 10
const ADMIN_FEE_RATIO = 100

const convertFee = (percent: number | string, ratio: number, representation: Representations) => {
  switch (representation) {
    case Representations.interface:
      return new BigNumber(percent).div(ratio).toNumber()
    case Representations.contract:
      return new BigNumber(percent).times(ratio).toNumber()
    default:
      return
  }
}

export default function SwapContracts(props: any) {
  const { pending, setPending, setError } = props
  const { t } = useTranslation()
  const { library, account, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
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
  const [totalFee, setTotalFee] = useState<number | string>('')
  const [adminFee, setAdminFee] = useState<number | string>('')

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  const fetchContractOptions = async () => {
    if (!library) return

    setPending(true)

    try {
      const options: any = await getFactoryOptions(library, factory)

      if (options) {
        const { protocolFee, totalFee, feeTo, feeToSetter, allFeeToProtocol } = options

        setAdmin(feeToSetter)
        setFeeRecipient(feeTo === ZERO_ADDRESS ? '' : feeTo)
        setAllFeesToAdmin(allFeeToProtocol)
        setTotalFee(convertFee(totalFee, TOTAL_FEE_RATIO, Representations.interface) || '')
        setAdminFee(convertFee(protocolFee, ADMIN_FEE_RATIO, Representations.interface) || '')
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
      case factoryMethods.setTotalFee:
        value = convertFee(totalFee, TOTAL_FEE_RATIO, Representations.contract)
        break
      case factoryMethods.setProtocolFee:
        value = convertFee(adminFee, ADMIN_FEE_RATIO, Representations.contract)
        break
      default:
        value = ''
    }

    setPending(true)

    try {
      await setFactoryOption({
        //@ts-ignore
        library,
        from: account ?? '',
        factoryAddress: factory,
        method,
        value,
        onHash: (hash: string) => {
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Save factory settings`,
            }
          )
        },
      })
    } catch (error) {
      setError(error)
    }

    setPending(false)
  }

  const setValidValue = ({
    v,
    set,
    min,
    max,
    maxDecimals,
  }: {
    v: string
    set: (v: any) => void
    min: number
    max: number
    maxDecimals: number
  }) => {
    let validValue = v.replace(/-/g, '')
    const bigNum = new BigNumber(validValue)

    if (bigNum.isLessThan(min) || bigNum.isGreaterThan(max)) return

    const floatCoincidence = validValue.match(/\..+/)

    if (floatCoincidence) {
      const floatNums = floatCoincidence[0].slice(1)

      if (floatNums.length <= maxDecimals) set(validValue)
    } else {
      set(validValue)
    }
  }

  return (
    <section>
      <OptionWrapper>
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
      </OptionWrapper>

      <Info>{t('youCanUseTheSameAddressForBoothInputs')}</Info>

      <div className={`${!factoryIsCorrect || pending ? 'disabled' : ''}`}>
        <OptionWrapper>
          <AddressInputPanel label={`${t('newAdmin')}`} value={admin} onChange={setAdmin} />
          <Button onClick={() => saveOption(factoryMethods.setFeeToSetter)} disabled={!admin}>
            {t('save')}
          </Button>
        </OptionWrapper>
        <OptionWrapper>
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
        </OptionWrapper>

        <Accordion title={t('feeSettings')}>
          <OptionWrapper margin={1}>
            <Box>
              <LabelExtended>
                <Checkbox name="all fees to the admin" onChange={updateFeesToAdmin} />
                {t('allFeesToAdmin')}
              </LabelExtended>
            </Box>
            <Button onClick={() => saveOption(factoryMethods.setAllFeeToProtocol)} disabled={!factoryIsCorrect}>
              {t('save')}
            </Button>
          </OptionWrapper>

          <Info>
            {t('feesDescription')}.
            <List>
              <li>{t('caseWhenNoFeesCharged')}</li>
              <li>
                <strong>{t('adminFeeIsPercentOfTotalFee')}</strong>
              </li>
            </List>
          </Info>

          {/* form tag for the native validation */}
          <form action="" onSubmit={() => false}>
            <OptionWrapper>
              <InputPanel
                type="number"
                min={0}
                max={99}
                step={0.1}
                label={`${t('liquidityProviderFee')} (0% - 99%)`}
                value={totalFee}
                onChange={(v) =>
                  setValidValue({
                    v,
                    set: setTotalFee,
                    min: 0,
                    max: 99,
                    maxDecimals: 1,
                  })
                }
              />
              <Button
                onClick={() => saveOption(factoryMethods.setTotalFee)}
                disabled={!factoryIsCorrect || (!totalFee && totalFee !== 0) || totalFee < adminFee}
              >
                {t('save')}
              </Button>
            </OptionWrapper>

            <OptionWrapper>
              <InputPanel
                type="number"
                min={0}
                max={100}
                step={0.01}
                label={`${t('adminFee')} (0% - 100%)`}
                value={adminFee}
                onChange={(v) =>
                  setValidValue({
                    v,
                    set: setAdminFee,
                    min: 0,
                    max: 100,
                    maxDecimals: 2,
                  })
                }
              />
              <Button
                onClick={() => saveOption(factoryMethods.setProtocolFee)}
                disabled={!factoryIsCorrect || (!adminFee && adminFee !== 0)}
              >
                {t('save')}
              </Button>
            </OptionWrapper>
          </form>
        </Accordion>
      </div>
    </section>
  )
}
