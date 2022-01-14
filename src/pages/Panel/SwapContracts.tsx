import React, { useState, useEffect } from 'react'
import styled, { withTheme } from 'styled-components'
import { BigNumber } from 'bignumber.js'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import Slider, { SliderTooltip } from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useActiveWeb3React } from 'hooks'
import { useProjectInfo } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useTranslation } from 'react-i18next'
import { ButtonPrimary } from 'components/Button'
import Accordion from 'components/Accordion'
import AddressInputPanel from 'components/AddressInputPanel'
import QuestionHelper from 'components/QuestionHelper'
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

const SliderWrapper = styled.div`
  margin-bottom: 1.4rem;
  padding: 0.4rem 1rem;

  .top {
    margin-bottom: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bottom {
    padding: 0 0.3rem;
  }
`

enum Representations {
  contract,
  interface,
}

const MAX_PERCENT = 100
const TOTAL_FEE_RATIO = 10
const PROTOCOL_FEE_RATIO = 100

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

const handleSliderChange = (props: any) => {
  const { value, dragging, index, ...rest } = props

  return (
    <SliderTooltip prefixCls="rc-slider-tooltip" overlay={`${value}%`} visible={dragging} placement="top" key={index}>
      <Slider.Handle value={value} {...rest} />
    </SliderTooltip>
  )
}

function SwapContracts(props: any) {
  const { pending, setPending, setError, theme } = props
  const { t } = useTranslation()
  const { library, account, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const { factory: stateFactory, protocolFee: currentProtocolFee, possibleProtocolPercent } = useProjectInfo()
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
  const [protocolFee, setProtocolFee] = useState<number | string>('')

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  // TODO: we have options in the state, on first loading. Use them
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
        setProtocolFee(convertFee(protocolFee, PROTOCOL_FEE_RATIO, Representations.interface) || '')
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
        value = convertFee(protocolFee, PROTOCOL_FEE_RATIO, Representations.contract)
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

  const sliderMarks = possibleProtocolPercent?.length
    ? possibleProtocolPercent.reduce((acc, percent, i) => {
        const humanPercent = new BigNumber(percent).div(PROTOCOL_FEE_RATIO).toNumber()

        return {
          ...acc,
          [humanPercent]: i === 0 || i === possibleProtocolPercent?.length - 1 ? `${humanPercent}%` : '',
        }
      }, {})
    : { 1: 1, 100: 100 }

  return (
    <section>
      <OptionWrapper>
        <InputWrapper>
          <AddressInputPanel label={`${t('factoryAddress')} *`} value={factory} onChange={setFactory} disabled />
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

          <SliderWrapper>
            <div className="top">
              <span>{t('admin')}</span>
              <span>{t('liquidityProviders')}</span>
            </div>

            <div className="bottom">
              <Slider
                min={0}
                max={100}
                defaultValue={
                  currentProtocolFee ? new BigNumber(currentProtocolFee).div(PROTOCOL_FEE_RATIO).toNumber() : 0
                }
                marks={sliderMarks}
                step={null}
                handle={handleSliderChange}
                onChange={(protocolFee) => {
                  setProtocolFee(protocolFee)
                  setTotalFee(MAX_PERCENT - protocolFee)
                }}
                trackStyle={{ backgroundColor: theme.primary2 }}
                railStyle={{ backgroundColor: theme.bg3 }}
              />
            </div>
          </SliderWrapper>

          <Button
            onClick={() => saveOption(factoryMethods.setProtocolFee)}
            disabled={!factoryIsCorrect || (!protocolFee && protocolFee !== 0)}
          >
            {t('save')}
          </Button>
        </Accordion>
      </div>
    </section>
  )
}

export default withTheme(SwapContracts)
