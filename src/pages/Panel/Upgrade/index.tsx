import React, { FC, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { UnsupportedChainIdError } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { SUPPORTED_WALLETS } from '../../../constants'
import { Addition, paidAdditions, requiredPaymentNetworkId } from '../../../constants/onout'
import { switchInjectedNetwork } from 'utils/wallet'
import crypto from 'utils/crypto'
import onout from 'shared/services/onout'
// import price from 'shared/services/price'
import TextBlock from 'components/TextBlock'
import { ButtonPrimary } from 'components/Button'
import AdditionBlock from './AdditionBlock'
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

const adds = {
  [Addition.switchCopyright]: false,
  [Addition.premiumVersion]: false,
}

const requiredPaymentNetwork = networks[requiredPaymentNetworkId]

const Upgrade: FC = () => {
  const { t } = useTranslation()
  const { account, library, chainId, activate } = useActiveWeb3React()
  const { additions } = useAppState()
  const addTransaction = useTransactionAdder()

  // @todo move this check in the loading data step
  const verifiedAdds = useMemo((): Record<Addition, boolean> => {
    if (Object.keys(additions).length && account) {
      if (additions[Addition.switchCopyright] === crypto.generateMd5Hash(`${Addition.switchCopyright}-${account}`)) {
        adds[Addition.switchCopyright] = true
      }
      if (additions[Addition.premiumVersion] === crypto.generateMd5Hash(`${Addition.premiumVersion}-${account}`)) {
        adds[Addition.premiumVersion] = true
      }
    }

    return adds
  }, [additions, account])

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

  const onTxHash = (hash: string) => {
    console.log(hash)

    addTransaction(
      { hash },
      {
        summary: 'Paid for copyright switching',
      }
    )
    // @todo activation transaction
  }

  const buyCopyrightSwitching = () => {
    if (library && account) {
      onout.payment({
        library,
        from: account,
        cryptoAmount: '0.001',
        onHash: onTxHash,
      })
    }
  }

  const buyPremiumVersion = () => {
    if (library && account) {
      onout.payment({
        library,
        from: account,
        cryptoAmount: '0.001',
        onHash: onTxHash,
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
          name={t('switchOnoutCopyright')}
          description={t('youCanTurnOffOnoutCopyright')}
          usdCost={paidAdditions.switchCopyright.usdCost}
          assetName="BNB"
          isPurchased={verifiedAdds[Addition.switchCopyright]}
          onPayment={buyCopyrightSwitching}
        />
        <AdditionBlock
          name={t('premiumVersion')}
          description={t('youWillBeAbleToTurnOffOnoutFeeAndCopyright')}
          cryptoCost={2}
          assetName="BNB"
          usdCost={paidAdditions.premiumVersion.usdCost}
          isPurchased={verifiedAdds[Addition.premiumVersion]}
          onPayment={buyPremiumVersion}
        />
      </StyledAdditions>
    </StyledWrapper>
  )
}

export default Upgrade
