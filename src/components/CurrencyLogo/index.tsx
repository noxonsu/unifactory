import { Currency, Token } from 'sdk'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import { CURRENCY } from 'assets/images'
import { useBaseCurrency } from 'hooks/useCurrency'
import useHttpLocations from 'hooks/useHttpLocations'
import { WrappedTokenInfo } from 'state/lists/hooks'
import { isAssetEqual } from 'utils'
import Logo from '../Logo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const baseCurrency = useBaseCurrency()
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const sources: string[] = useMemo(() => {
    if (isAssetEqual(currency, baseCurrency)) return []

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)]
      }

      return [getTokenLogoURL(currency.address)]
    }
    return []
  }, [currency, uriLocations, baseCurrency])

  if (isAssetEqual(currency, baseCurrency)) {
    //@ts-ignore
    const source = CURRENCY[baseCurrency.symbol?.toUpperCase() ?? '']

    if (source) {
      return <StyledEthereumLogo src={source} size={size} style={style} />
    }
  }

  return <StyledLogo size={size} srcs={sources} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
