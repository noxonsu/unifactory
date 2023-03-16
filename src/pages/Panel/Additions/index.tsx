import React, { FC, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { SUPPORTED_WALLETS, THIRTY_SECONDS_IN_MS } from '../../../constants'
import { Addition, AdditionName, paidAdditions, requiredPaymentNetworkId, onoutUrl } from '../../../constants/onout'
import { switchInjectedNetwork } from 'utils/wallet'
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

const Upgrade: FC = () => {
  const { t } = useTranslation()
  const { library } = useWeb3React()
  const { account, chainId, activate } = useActiveWeb3React()
  const { additions } = useAppState()
  const addTransaction = useTransactionAdder()

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

  const [isNetworkPending, setIsNetworkPending] = useState(false)

  const switchToRequiredPaymentNetwork = async () => {
    // @todo how to find the current wallet type?
    const { connector } = SUPPORTED_WALLETS.INJECTED // SUPPORTED_WALLETS[key]

    setIsNetworkPending(true)

    if (connector instanceof InjectedConnector) {
      const result = await switchInjectedNetwork(requiredPaymentNetworkId)

      if (!result) {
        //
      }
    } // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    else if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector)
        }
      })

    setIsNetworkPending(false)
  }

  const saveAdditionKey = async ({
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
      // @todo save in local storage
      const additionKey = onout.generateAdditionKey({ addition, account })

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
      })
    }
  }

  const buyCopyrightSwitching = () => {
    if (library && account) {
      onout.payment({
        forWhat: 'Copyright switching',
        library,
        from: account,
        cryptoAmount: String(cryptoPrices.switchCopyright),
        onComplete: async ({ hash, isSuccess }) =>
          saveAdditionKey({
            hash,
            isSuccess,
            summaryName: 'copyright switching',
            addition: Addition.switchCopyright,
          }),
      })
    }
  }

  const buyPremiumVersion = () => {
    if (library && account) {
      onout.payment({
        forWhat: 'Premium version',
        library,
        from: account,
        cryptoAmount: String(cryptoPrices.premiumVersion),
        onComplete: ({ hash, isSuccess }) =>
          saveAdditionKey({
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
          <Button onClick={switchToRequiredPaymentNetwork} disabled={isNetworkPending}>
            {isNetworkPending ? t('pending') : t('switchToNetwork', { network: requiredPaymentNetwork.name })}
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
        />
        <AdditionBlock
          name={t('premiumVersion')}
          description={t('youCanTurnOffOnoutFeeAndCopyright')}
          assetName={requiredPaymentNetwork.baseCurrency.symbol}
          usdCost={paidAdditions.premiumVersion.usdCost}
          cryptoCost={cryptoPrices.premiumVersion}
          isPurchased={additions[Addition.premiumVersion]?.isValid}
          onPayment={buyPremiumVersion}
        />
      </StyledAdditions>
    </StyledWrapper>
  )
}

export default Upgrade
