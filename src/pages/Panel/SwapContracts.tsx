import React, { useState, useEffect, useCallback } from 'react'
import isNumber from 'is-number'
import styled, { withTheme } from 'styled-components'
import { BigNumber } from 'bignumber.js'
import { Box } from 'rebass'
import { Label, Checkbox } from '@rebass/forms'
import Slider, { SliderTooltip } from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useDispatch } from 'react-redux'
import { RiErrorWarningLine } from 'react-icons/ri'
import { ZERO_ADDRESS } from 'sdk'
import { useActiveWeb3React } from 'hooks'
import { useAddPopup, useAppState } from 'state/application/hooks'
import { updateAppOptions } from 'state/application/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_NETWORKS } from '../../connectors'
import { FactoryMethod, STORAGE_NETWORK_ID, STORAGE_NETWORK_NAME } from '../../constants'
import { Addition, onoutFeeAddress } from '../../constants/onout'
import { ButtonPrimary } from 'components/Button'
import Accordion from 'components/Accordion'
import QuestionHelper from 'components/QuestionHelper'
import InputPanel from 'components/InputPanel'
import AddressInputPanel from 'components/AddressInputPanel'
import TextBlock from 'components/TextBlock'
import ConfirmationModal from './ConfirmationModal'
import { OptionWrapper } from './index'
import { PartitionWrapper } from './index'
import { isValidAddress, setFactoryOption, deploySwapContracts } from 'utils/contract'
import { saveAppData } from 'utils/storage'
import useWordpressInfo from 'hooks/useWordpressInfo'
import { PanelTab } from './'
import { StyledPurchaseButton, List, NumList } from './styled'

const Title = styled.h3`
  font-weight: 400;
  margin: 0 0 0.5rem;
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
  set: (v: string) => void
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
  const { domain, pending, setPending, theme, wrappedToken, setTab } = props
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { library, account, chainId } = useActiveWeb3React()
  const wordpressData = useWordpressInfo()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()
  const {
    contracts,
    admin: stateAdmin,
    factory: stateFactory,
    router: stateRouter,
    totalFee: currentTotalFee,
    protocolFee: currentProtocolFee,
    feeRecipient: currentFeeRecipient,
    possibleProtocolPercent,
    allFeeToProtocol,
    onoutFeeTo,
    additions,
  } = useAppState()

  const [canDeploySwapContracts, setCanDeploySwapContracts] = useState(false)
  const [adminAddress, setAdminAddress] = useState(stateAdmin !== ZERO_ADDRESS ? stateAdmin : account || '')
  const [isOnoutFeeActive, setIsOnoutFeeActive] = useState(false)

  useEffect(() => {
    setIsOnoutFeeActive(!!onoutFeeTo && onoutFeeTo !== ZERO_ADDRESS)
  }, [onoutFeeTo])

  const [originFeeAddress, setOriginFeeAddress] = useState(
    additions[Addition.premiumVersion]?.isValid ? ZERO_ADDRESS : onoutFeeAddress
  )

  useEffect(() => {
    setOriginFeeAddress(additions[Addition.premiumVersion]?.isValid ? ZERO_ADDRESS : onoutFeeAddress)
  }, [additions])

  const switchOnoutFee = () => {
    setIsOnoutFeeActive((isActive) => {
      const newState = !isActive

      setOriginFeeAddress(newState ? onoutFeeAddress : ZERO_ADDRESS)

      return newState
    })
  }

  useEffect(() => {
    const lowerAccount = account?.toLowerCase()
    const adminIsFine =
      stateAdmin && stateAdmin !== ZERO_ADDRESS
        ? lowerAccount === stateAdmin.toLowerCase()
        : wordpressData?.wpAdmin
        ? lowerAccount === wordpressData.wpAdmin.toLowerCase()
        : true

    setCanDeploySwapContracts(
      isValidAddress(adminAddress) && wrappedToken && isValidAddress(wrappedToken) && adminIsFine
    )
  }, [library, adminAddress, wrappedToken, account, wordpressData, stateAdmin])

  const [admin, setAdmin] = useState(stateAdmin !== ZERO_ADDRESS ? stateAdmin : '')
  const [feeRecipient, setFeeRecipient] = useState(currentFeeRecipient || '')

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

  const [userContractsChainId, setUserContractsChainId] = useState(chainId && !!contracts[chainId || 0] ? chainId : '')
  const [userFactory, setUserFactory] = useState(contracts[chainId || 0]?.factory || '')
  const [deployUserFactory, setDeployUserFactory] = useState('')
  const [userRouter, setUserRouter] = useState(contracts[chainId || 0]?.router || '')
  const [canSaveSwapContracts, setCanSaveSwapContracts] = useState(false)

  useEffect(() => {
    /*
    const differentContracts =
      userFactory.toLowerCase() !== contracts[chainId || 0]?.factory?.toLowerCase() &&
      userRouter.toLowerCase() !== contracts[chainId || 0]?.router?.toLowerCase() &&
      userFactory.toLowerCase() !== userRouter.toLowerCase()
    */
    setCanSaveSwapContracts(
      chainId === STORAGE_NETWORK_ID &&
        userContractsChainId in SUPPORTED_NETWORKS &&
        isValidAddress(userFactory) &&
        isValidAddress(userRouter)
      // Bug: На разных сетях могут быть сгенерированны контракты с одинаковым адресом
      // Сначала сделали контракты для BSC
      // Потом для арбитра
      // Включаем BSC но не можем сохранить для арбитра (адреса у контрактов одинаковые)
      // Времено выключено, нужно искать другое решение
      /* &&
        differentContracts
        */
    )
  }, [chainId, userContractsChainId, userFactory, userRouter, contracts])

  const saveContractsData = async (chainId: number, factory: string, router: string) => {
    if (!chainId) return

    try {
      await saveAppData({
        //@ts-ignore
        library,
        owner: adminAddress,
        data: {
          contracts: {
            [chainId]: {
              factory,
              router,
            },
          },
        },
        onReceipt: (_, success) => success && window.location.reload(),
      })
    } catch (error) {
      console.error(error)
    }
  }

  const saveSwapContracts = () => {
    try {
      saveContractsData(Number(userContractsChainId), userFactory, userRouter)
    } catch (error) {
      console.error(error)
    }
  }

  const onContractsDeployment = async () => {
    if (!chainId) return

    setAttemptingTxn(true)

    try {
      await deploySwapContracts({
        domain,
        chainId,
        //@ts-ignore
        library,
        //@ts-ignore
        hasFactory: deployUserFactory !== '' ? deployUserFactory : false,
        admin: adminAddress,
        originFeeAddress,
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
        onSuccessfulDeploy: async ({ chainId, factory, router }) => {
          if (chainId === STORAGE_NETWORK_ID) {
            await saveContractsData(chainId, factory, router)
          } else {
            setUserContractsChainId(String(chainId))
            setUserFactory(factory)
            setUserRouter(router)
          }

          setAttemptingTxn(false)
        },
      })
    } catch (error) {
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
      setAttemptingTxn(false)
    }
  }

  const updateFeesToAdmin = (event: any) => setAllFeesToAdmin(event.target.checked)

  const updateOnoutFee = () => {
    dispatch(
      updateAppOptions([
        {
          key: 'onoutFeeTo',
          value: originFeeAddress,
        },
      ])
    )
  }

  const saveOption = async (method: string) => {
    const values: unknown[] = []
    let onSave: VoidFunction

    switch (method) {
      case FactoryMethod.setFeeToSetter:
        values.push(admin)
        break
      case FactoryMethod.setFeeTo:
        values.push(feeRecipient)
        break
      case FactoryMethod.setOnoutFeeTo:
        values.push(originFeeAddress)
        onSave = updateOnoutFee
        break
      case FactoryMethod.setAllFeeToProtocol:
        values.push(allFeesToAdmin)
        break
      case FactoryMethod.setTotalFee:
        values.push(convertFee(totalFee, TOTAL_FEE_RATIO, Representations.contract))
        break
      case FactoryMethod.setProtocolFee:
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
        onReceipt: (_, success) => success && onSave(),
      })
    } catch (error) {
      const REJECT = 4001

      if (error?.code !== REJECT) {
        addPopup({
          error: {
            message: error.message,
            code: error.code,
          },
        })
      }
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
        title={t('swapContracts')}
        confirmBtnMessageId={'deploy'}
        content={
          <div>
            {t('youAreDeployingSwapContracts')}. {t('youHaveToConfirmTheseTxs')}:
            <NumList>
              <li>{t('deployFactoryContract')}</li>
              <li>{t('deployRouterContract')}</li>
              <li>{t('saveInfoToDomainRegistry')}</li>
            </NumList>
            {t('ifYouAlreadyHaveFactorySpecifyIt')}
            <InputWrapper>
              <InputPanel
                label="Factory (Optional)"
                placeholder={`0x...`}
                value={deployUserFactory}
                onChange={setDeployUserFactory}
              />
            </InputWrapper>
          </div>
        }
      />
      <PartitionWrapper highlighted>
        <Accordion title={t('deployment')} openByDefault={!(stateFactory && stateRouter)} minimalStyles contentPadding>
          {stateFactory && stateRouter ? (
            <TextBlock type="warning">{t('youAlreadyHaveSwapContractsWarning')}</TextBlock>
          ) : (
            <></>
          )}
          <InputWrapper>
            <AddressInputPanel
              label={`${t('admin')} (${t('your')}) ${t('address').toLowerCase()} *`}
              value={adminAddress}
              onChange={setAdminAddress}
            />
          </InputWrapper>
          <InputWrapper>
            <InputPanel label={`${t('domain')} *`} value={domain} disabled />
          </InputWrapper>
          <Button onClick={() => setShowConfirm(true)} disabled={pending || !canDeploySwapContracts}>
            {t('deploySwapContracts')}
          </Button>
        </Accordion>
      </PartitionWrapper>

      <PartitionWrapper>
        <TextBlock type="warning">{t('instructionToSaveContractsFromDifferentNetwork')}</TextBlock>
        <InputWrapper>
          <InputPanel
            label={`${t('contractsNetwork')} *`}
            value={userContractsChainId}
            onChange={setUserContractsChainId}
          />
        </InputWrapper>
        <InputWrapper>
          <InputPanel label="Factory *" value={userFactory} onChange={setUserFactory} />
        </InputWrapper>
        <InputWrapper>
          <InputPanel label="Router *" value={userRouter} onChange={setUserRouter} />
        </InputWrapper>
        <Button onClick={saveSwapContracts} disabled={pending || !canSaveSwapContracts}>
          {t(chainId === STORAGE_NETWORK_ID ? 'saveSwapContracts' : 'switchToNetwork', {
            network: STORAGE_NETWORK_NAME,
          })}
        </Button>
      </PartitionWrapper>

      <PartitionWrapper>
        <Title>{t('settings')}</Title>
        <TextBlock>{t('youCanUseTheSameAddressForBoothInputs')}</TextBlock>

        <div className={`${!stateFactory || pending ? 'disabled' : ''}`}>
          <OptionWrapper>
            <AddressInputPanel label={`${t('newAdmin')}`} value={admin} onChange={setAdmin} />
            <Button onClick={() => saveOption(FactoryMethod.setFeeToSetter)} disabled={!admin}>
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
            <Button onClick={() => saveOption(FactoryMethod.setFeeTo)} disabled={!feeRecipient}>
              {t('save')}
            </Button>
          </OptionWrapper>

          <Accordion title={t('feeSettings')}>
            {additions[Addition.premiumVersion]?.isValid ? (
              <OptionWrapper margin={1}>
                <Box>
                  <LabelExtended>
                    <Checkbox name="Onout fee is disabled" onChange={switchOnoutFee} checked={!isOnoutFeeActive} />
                    {t('onoutFeeIsDisabled')}
                  </LabelExtended>
                </Box>
                <Button onClick={() => saveOption(FactoryMethod.setOnoutFeeTo)}>{t('save')}</Button>
              </OptionWrapper>
            ) : (
              <>
                <TextBlock type="notice">
                  {t('noticeAboutOnoutFee', {
                    onoutFee: '20%',
                    adminFee: '80%',
                  })}
                  <StyledPurchaseButton onClick={() => setTab(PanelTab.additions)} width="100%" margin="12px 0 0">
                    {t('purchase')}
                  </StyledPurchaseButton>
                </TextBlock>
              </>
            )}

            <OptionWrapper margin={1}>
              <Box>
                <LabelExtended>
                  <Checkbox name="all fees to the admin" onChange={updateFeesToAdmin} />
                  {t('allFeesToAdmin')}
                </LabelExtended>
              </Box>
              <Button onClick={() => saveOption(FactoryMethod.setAllFeeToProtocol)}>{t('save')}</Button>
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
                onClick={() => saveOption(FactoryMethod.setTotalFee)}
                disabled={
                  (!totalFee && totalFee !== 0) || isEqualCurrentFee(currentTotalFee, totalFee, TOTAL_FEE_RATIO)
                }
              >
                {t('save')}
              </Button>
            </OptionWrapper>

            {!feeRecipient ? (
              <TextBlock type="warning">{t('noPointToChangeAdminFeeWithoutFeeRecipient')}</TextBlock>
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
              onClick={() => saveOption(FactoryMethod.setProtocolFee)}
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
