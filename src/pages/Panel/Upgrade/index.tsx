import React, { FC, useMemo } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { Addition, paidAdditions, onoutFeeAddress } from '../../../constants/onout'
import crypto from 'utils/crypto'
import onout from 'shared/services/onout'
import AdditionBlock from './AdditionBlock'

const StyledWrapper = styled.div`
  padding-top: 0.5rem;
`

const adds = {
  [Addition.switchCopyright]: false,
  [Addition.premiumVersion]: false,
}

const Upgrade: FC = () => {
  const { t } = useTranslation()
  const { account, library } = useActiveWeb3React()
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

  return (
    <StyledWrapper>
      <AdditionBlock
        name={t('switchOnoutCopyright')}
        description={t('youCanTurnOffOnoutCopyright')}
        cryptoCost={paidAdditions.switchCopyright.cryptoCost}
        assetName="BNB"
        usdCost={500}
        isPurchased={verifiedAdds[Addition.switchCopyright]}
        onPayment={buyCopyrightSwitching}
      />
      <AdditionBlock
        name={t('premiumVersion')}
        description={t('youWillBeAbleToTurnOffOnoutFeeAndCopyright')}
        cryptoCost={2}
        assetName="BNB"
        usdCost={1000}
        isPurchased={verifiedAdds[Addition.premiumVersion]}
        onPayment={buyPremiumVersion}
      />
    </StyledWrapper>
  )
}

export default Upgrade
