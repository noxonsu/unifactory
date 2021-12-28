import React, { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { ButtonSecondary } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { injected } from 'utils/wallet'

const Wrapper = styled.div`
  width: 100%;
`

export default function Wallet(props: any) {
  const { setPending, setError } = props
  const { t } = useTranslation()
  const { deactivate, activate } = useActiveWeb3React()

  const activateWallet = useCallback(
    (connector: any) => {
      setPending(true)
      setError(false)

      activate(connector, undefined, true)
        .catch(setError)
        .finally(() => setPending(false))
    },
    [activate, setError, setPending]
  )

  useEffect(() => {
    injected.isAuthorized().then((authorized: any) => {
      if (authorized) {
        activateWallet(injected)
      }
    })
  }, [activateWallet])

  const disconnect = () => deactivate()

  return (
    <Wrapper>
      <ButtonSecondary onClick={disconnect}>{t('disconnect')}</ButtonSecondary>
    </Wrapper>
  )
}
