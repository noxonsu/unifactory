import React, { FC, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { useDispatch } from 'react-redux'
import { useWeb3React } from '@web3-react/core'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { updateAppOptions } from 'state/application/actions'
import { useAppState } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { THIRTY_SECONDS_IN_MS } from '../../../constants'
import { Addition, AdditionName, onoutUrl, paidAdditions, requiredPaymentNetworkId } from '../../../constants/onout'
import cache from 'utils/cache'
import { saveAppData } from 'utils/storage'
import onout from 'shared/services/onout'
import price from 'shared/services/price'
import TextBlock from 'components/TextBlock'
import { ButtonPrimary } from 'components/Button'
import AdditionBlock from './AdditionBlock'
import { StyledOnoutLink } from '../styled'
import networks from 'networks.json'

const StyledWrapper = styled.div`
  padding-top: 0.5rem;
`

const StyledNotification = styled.div`
  margin-bottom: 20px;
`

const StyledAdditions = styled.div<{ disabled: boolean }>`
  ${({ disabled }) =>
    disabled &&
    css`
      pointer-events: none;
      opacity: 0.6;
    `}
`

const Button = styled(ButtonPrimary)`
  padding: 12px 7%;
  background-color: ${({ theme }) => theme.blue2};
  color: ${({ theme }) => theme.white1};
  transition: 120ms;

  :hover {
    opacity: 0.7;
    background-color: ${({ theme }) => theme.blue2};
  }
`

const requiredPaymentNetwork = networks[requiredPaymentNetworkId]

type Props = {
  switchToNetwork: (chainId: number) => void
  pending: boolean
}

const Upgrade: FC<Props> = ({ switchToNetwork, pending }) => {
  const { t } = useTranslation()
  const { library } = useWeb3React()
  const { account, chainId } = useActiveWeb3React()
  const { additions } = useAppState()
  const dispatch = useDispatch()
  const addTransaction = useTransactionAdder()

  const premiumKey = onout.generateAdditionKey({ addition: Addition.premiumVersion, account: account || '' })
  const copyrightKey = onout.generateAdditionKey({ addition: Addition.switchCopyright, account: account || '' })

  const [paymentCryptoPrice, setPaymentCryptoPrice] = useState<number | undefined>()

  useEffect(() => {
    const priceItem = cache.get<number>('cryptoPrice', String(requiredPaymentNetworkId))
    const now = Date.now()

    if (priceItem?.value && priceItem?.deadline && priceItem.deadline > now) {
      setPaymentCryptoPrice(priceItem.value)
    } else {
      const fetch = async () => {
        const cryptoPrice = await price.fetchCryptoPrice({
          symbol: requiredPaymentNetwork.baseCurrency.symbol,
        })

        if (cryptoPrice) {
          cache.add({
            area: 'cryptoPrice',
            key: String(requiredPaymentNetworkId),
            value: cryptoPrice,
            deadline: now + THIRTY_SECONDS_IN_MS,
          })
          setPaymentCryptoPrice(cryptoPrice)
        }
      }

      fetch()
    }
  }, [])

  const cryptoPrices = useMemo(() => {
    const prices = {} as Record<AdditionName, number | undefined>

    if (typeof paymentCryptoPrice === 'number') {
      Object.keys(paidAdditions).forEach((k) => {
        const { usdCost } = paidAdditions[k as AdditionName]

        prices[k as AdditionName] = price.calculateCryptoAmount({
          fiatAmount: usdCost,
          cryptoPrice: paymentCryptoPrice,
        })
      })
    }

    return prices
  }, [paymentCryptoPrice])

  const updateAdditionStateInfo = (addition: Addition, key: string) => {
    dispatch(
      updateAppOptions([
        {
          key: 'additions',
          value: {
            ...additions,
            [addition]: {
              key,
              isValid: true,
            },
          },
        },
      ])
    )
  }

  const saveAdditionKey = async (addition: Addition, additionKey: string) => {
    if (account) {
      await saveAppData({
        //@ts-ignore
        library,
        owner: account,
        data: {
          additions: {
            [addition]: additionKey,
          },
        },
        onHash: (hash: string) => {
          addTransaction(
            { hash },
            {
              summary: 'Addition key was saved',
            }
          )
        },
        onReceipt: (_, success) => {
          if (success) updateAdditionStateInfo(addition, additionKey)
        },
      })
    }
  }

  const activateAddition = async ({
    hash,
    isSuccess,
    summaryName,
    addition,
  }: {
    hash: string
    isSuccess: boolean
    summaryName: string
    addition: Addition
  }) => {
    addTransaction(
      { hash },
      {
        summary: `${isSuccess ? 'Successful' : 'Unsuccessful'} paid for ${summaryName}`,
      }
    )

    if (isSuccess && account) {
      const additionKey = onout.generateAdditionKey({ addition, account })
      // Save it just in case the user has any problems approving the second TX
      localStorage.setItem(
        `${addition}_${account}_addition_key`,
        JSON.stringify({
          addition,
          account,
          additionKey,
        })
      )

      await saveAdditionKey(addition, additionKey)
    }
  }

  const buyCopyrightSwitching = async () => {
    if (library && account) {
      await onout.payment({
        forWhat: 'Copyright switching',
        library,
        from: account,
        cryptoAmount: String(cryptoPrices.switchCopyright),
        onComplete: async ({ hash, isSuccess }) =>
          activateAddition({
            hash,
            isSuccess,
            summaryName: 'copyright switching',
            addition: Addition.switchCopyright,
          }),
      })
    }
  }

  const buyPremiumVersion = async () => {
    if (library && account) {
      await onout.payment({
        forWhat: 'Premium version',
        library,
        from: account,
        cryptoAmount: String(cryptoPrices.premiumVersion),
        onComplete: ({ hash, isSuccess }) =>
          activateAddition({
            hash,
            isSuccess,
            summaryName: 'premium version',
            addition: Addition.premiumVersion,
          }),
      })
    }
  }

  const isRightNetwork = requiredPaymentNetworkId === Number(chainId)

  return (
    <StyledWrapper>
      {!isRightNetwork && (
        <StyledNotification>
          <TextBlock type="notice">
            {t('youHaveToUseNetworkForPayment', { requiredNetwork: requiredPaymentNetwork.name })}
          </TextBlock>
          <Button onClick={() => switchToNetwork(requiredPaymentNetwork.chainId)} disabled={pending}>
            {pending ? t('pending') : t('switchToNetwork', { network: requiredPaymentNetwork.name })}
          </Button>
        </StyledNotification>
      )}
      <StyledAdditions disabled={!isRightNetwork}>
        <AdditionBlock
          name={
            <>
              {t('removeCopyrightOf')}{' '}
              <StyledOnoutLink href={onoutUrl} target="_blank" rel="noopener noreferrer">
                onout.org
              </StyledOnoutLink>
            </>
          }
          description={t('youCanTurnOffOnoutCopyright')}
          assetName={requiredPaymentNetwork.baseCurrency.symbol}
          usdCost={paidAdditions.switchCopyright.usdCost}
          cryptoCost={cryptoPrices.switchCopyright}
          isPurchased={additions[Addition.switchCopyright]?.isValid}
          onPayment={buyCopyrightSwitching}
          onActivation={(key: string) => saveAdditionKey(Addition.switchCopyright, key)}
          requiredKey={copyrightKey}
          isLocked={additions[Addition.premiumVersion]?.isValid}
        />
        <AdditionBlock
          name={t('premiumVersion')}
          description={t('youCanTurnOffOnoutFeeAndCopyright')}
          notice={`(${t('doNotForgetDisableOnoutFee')})`}
          assetName={requiredPaymentNetwork.baseCurrency.symbol}
          usdCost={paidAdditions.premiumVersion.usdCost}
          cryptoCost={cryptoPrices.premiumVersion}
          isPurchased={additions[Addition.premiumVersion]?.isValid}
          onPayment={buyPremiumVersion}
          requiredKey={premiumKey}
          onActivation={(key: string) => saveAdditionKey(Addition.premiumVersion, key)}
        />
      </StyledAdditions>
    </StyledWrapper>
  )
}

export default Upgrade
