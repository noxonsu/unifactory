import React, { useState, useEffect, useCallback } from 'react'
import isNumber from 'is-number'
import styled, { withTheme, css } from 'styled-components'
import { BigNumber } from 'bignumber.js'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import Slider, { SliderTooltip } from 'rc-slider'
import 'rc-slider/assets/index.css'
import { RiErrorWarningLine } from 'react-icons/ri'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useTranslation } from 'react-i18next'
import { DEV_FEE_ADMIN } from '../../constants'
import { ButtonPrimary } from 'components/Button'
import Accordion from 'components/Accordion'
import QuestionHelper from 'components/QuestionHelper'
import InputPanel from 'components/InputPanel'
import AddressInputPanel from 'components/AddressInputPanel'
import TextBlock from 'components/TextBlock'
import ConfirmationModal from './ConfirmationModal'
import { isValidAddress, setFactoryOption, returnTokenInfo, deploySwapContracts } from 'utils/contract'
import { factoryMethods } from '../../constants'
import networks from 'networks.json'

const PartitionWrapper = styled.div`
  margin-top: 1rem;
`

const Title = styled.h3`
  font-weight: 400;
  margin: 0 0 0.5rem;
`

const OptionWrapper = styled.div<{ margin?: number }>`
  margin: ${({ margin }) => margin || 0.3}rem 0;
  padding: 0.3rem 0;
`

const listStyles = css`
  padding: 0 0 0 1rem;

  li:not(:last-child) {
    margin-bottom: 0.4rem;
  }
`

const List = styled.ul`
  ${listStyles}
`

const NumList = styled.ol`
  ${listStyles}
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
  padding: 0.4rem 0;

  .top {
    margin-bottom: 0.5rem;
    padding: 0 0.4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bottom {
    padding: 0 0.7rem;
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
  const validValue = v.replace(/-/g, '')
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

function SwapContracts(props: any) {
  const { domain, pending, setPending, setError, theme, setDomainDataTrigger, wrappedToken } = props
  const { t } = useTranslation()
  const { library, account, chainId } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()
  const {
    admin: stateAdmin,
    factory: stateFactory,
    totalFee: currentTotalFee,
    protocolFee: currentProtocolFee,
    feeRecipient: currentFeeRecipient,
    possibleProtocolPercent,
    allFeeToProtocol,
  } = useAppState()

  const [canDeploySwapContracts, setCanDeploySwapContracts] = useState(false)
  const [adminAddress, setAdminAddress] = useState(stateAdmin || account || '')

  useEffect(() => {
    setCanDeploySwapContracts(
      //@ts-ignore
      isValidAddress(library, adminAddress) &&
        wrappedToken &&
        //@ts-ignore
        isValidAddress(library, wrappedToken)
    )
  }, [library, adminAddress, wrappedToken])

  const [admin, setAdmin] = useState(stateAdmin)
  const [feeRecipient, setFeeRecipient] = useState(currentFeeRecipient)
  const [allFeesToAdmin, setAllFeesToAdmin] = useState(allFeeToProtocol)
  const [totalFee, setTotalFee] = useState<number | string>(
    convertFee(Number(currentTotalFee), TOTAL_FEE_RATIO, Representations.interface) || ''
  )
  const [protocolFee, setProtocolFee] = useState<number | string>(
    convertFee(Number(currentProtocolFee), PROTOCOL_FEE_RATIO, Representations.interface) || ''
  )
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const onContractsDeployment = async () => {
    setAttemptingTxn(true)

    try {
      //@ts-ignore
      const tokenInfo = await returnTokenInfo(library, wrappedToken)

      if (!tokenInfo) {
        return setError(new Error('It is not a wrapped token address'))
      }

      await deploySwapContracts({
        domain,
        //@ts-ignore
        registryAddress: networks[chainId]?.registry,
        library,
        admin: adminAddress,
        devFeeAdmin: DEV_FEE_ADMIN,
        wrappedToken,
        onFactoryHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy factory`,
            }
          )
        },
        onRouterHash: (hash: string) => {
          setTxHash(hash)
          addTransaction(
            { hash },
            {
              summary: `Chain ${chainId}. Deploy router`,
            }
          )
        },
        onSuccessfulDeploy: () => {
          setAttemptingTxn(false)
          setDomainDataTrigger((state: boolean) => !state)
        },
      })
    } catch (error) {
      setError(error)
      setAttemptingTxn(false)
    }
  }

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  const saveOption = async (method: string) => {
    const values: any[] = []

    switch (method) {
      case factoryMethods.setFeeToSetter:
        values.push(admin)
        break
      case factoryMethods.setFeeTo:
        values.push(feeRecipient)
        break
      case factoryMethods.setAllFeeToProtocol:
        values.push(allFeesToAdmin)
        break
      case factoryMethods.setTotalFee:
        values.push(convertFee(totalFee, TOTAL_FEE_RATIO, Representations.contract))
        break
      case factoryMethods.setProtocolFee:
        values.push(convertFee(protocolFee, PROTOCOL_FEE_RATIO, Representations.contract))
        break
    }

    setPending(true)

    try {
      await setFactoryOption({
        //@ts-ignore
        library,
        from: account ?? '',
        factoryAddress: stateFactory,
        method,
        values,
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
      const REJECT = 4001

      if (error?.code !== REJECT) setError(error)
    }

    setPending(false)
  }

  //@ts-ignore
  const isEqualCurrentFee = (currentFee, fee, ratio) =>
    isNumber(currentFee) &&
    //@ts-ignore: currentFee can't be equal undefined
    new BigNumber(fee).times(ratio).isEqualTo(currentFee)

  const sliderMarks = possibleProtocolPercent?.length
    ? possibleProtocolPercent.reduce(
        (acc, percent, i) => {
          const humanPercent = new BigNumber(percent).div(PROTOCOL_FEE_RATIO).toNumber()
          // reduce available protocol percent (too many of them in UI)
          const allowed = [0.05, 0.1, 0.5, 1, 3, 5, 8, 10, 14]

          if (humanPercent < 16 && !allowed.includes(humanPercent)) {
            return acc
          }

          return {
            ...acc,
            [humanPercent]: humanPercent === 0 || humanPercent === 100 ? `${humanPercent}%` : '',
          }
        },
        { 0: '0%' }
      )
    : { 1: 1, 100: 100 }

  return (
    <section>
      <ConfirmationModal
        open={showConfirm}
        onDismiss={handleDismissConfirmation}
        onDeployment={onContractsDeployment}
        txHash={txHash}
        attemptingTxn={attemptingTxn}
        titleId={'swapContracts'}
        confirmBtnMessageId={'deploy'}
        content={
          <div>
            {t('youAreDeployingSwapContracts')}. {t('youHaveToConfirmTheseTxs')}:
            <NumList>
              <li>{t('deployFactoryContract')}</li>
              <li>{t('deployRouterContract')}</li>
              <li>{t('saveInfoToDomainRegistry')}</li>
            </NumList>
          </div>
        }
      />
      <PartitionWrapper>
        <Title>{t('deployment')}</Title>
        <InputWrapper>
          <AddressInputPanel
            label={`${t('admin')} (${t('your')}) ${t('address').toLowerCase()} *`}
            value={adminAddress}
            onChange={setAdminAddress}
          />
        </InputWrapper>
        <InputWrapper>
          <InputPanel label={`${t('domain')} *`} value={domain} onChange={() => null} disabled />
        </InputWrapper>
        <Button onClick={() => setShowConfirm(true)} disabled={pending || !canDeploySwapContracts}>
          {t('deploySwapContracts')}
        </Button>
      </PartitionWrapper>

      <PartitionWrapper>
        <Title>{t('settings')}</Title>
        <TextBlock>{t('youCanUseTheSameAddressForBoothInputs')}</TextBlock>

        <div className={`${!stateFactory || pending ? 'disabled' : ''}`}>
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
              <Button onClick={() => saveOption(factoryMethods.setAllFeeToProtocol)}>{t('save')}</Button>
            </OptionWrapper>

            <TextBlock>
              {t('feesDescription')}.
              <List>
                <li>{t('caseWhenNoFeesCharged')}</li>
                <li>
                  <strong>{t('adminFeeIsPercentOfTotalFee')}</strong>
                </li>
              </List>
            </TextBlock>

            <OptionWrapper>
              <InputPanel
                type="number"
                min={0}
                max={99}
                step={0.1}
                label={`${t('totalFee')} (0% - 99%)`}
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
                disabled={
                  (!totalFee && totalFee !== 0) || isEqualCurrentFee(currentTotalFee, totalFee, TOTAL_FEE_RATIO)
                }
              >
                {t('save')}
              </Button>
            </OptionWrapper>

            {!feeRecipient ? (
              <TextBlock warning>{t('noPointToChangeAdminFeeWithoutFeeRecipient')}</TextBlock>
            ) : (
              <span />
            )}
            <SliderWrapper className={!feeRecipient ? 'disabled' : ''}>
              {currentTotalFee === 0 && (
                <TextBlock flex>
                  <RiErrorWarningLine style={{ marginRight: '.5rem' }} /> {t('totalFee')} = 0%.{' '}
                  {t('adminAndProvidersFeesDoNotWork')}
                </TextBlock>
              )}

              <div className="top">
                <span>
                  {t('admin')}
                  {isNumber(protocolFee) && ` (${protocolFee})%`}
                </span>
                <span>
                  {t('liquidityProviders')}
                  {isNumber(protocolFee) && ` (${new BigNumber(MAX_PERCENT).minus(protocolFee).toString()}%)`}
                </span>
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
                  onChange={setProtocolFee}
                  trackStyle={{ backgroundColor: theme.primary2 }}
                  railStyle={{ backgroundColor: theme.bg3 }}
                />
              </div>
            </SliderWrapper>

            <Button
              onClick={() => saveOption(factoryMethods.setProtocolFee)}
              disabled={
                (!protocolFee && protocolFee !== 0) ||
                isEqualCurrentFee(currentProtocolFee, protocolFee, PROTOCOL_FEE_RATIO)
              }
            >
              {t('save')}
            </Button>
          </Accordion>
        </div>
      </PartitionWrapper>
    </section>
  )
}

export default withTheme(SwapContracts)
