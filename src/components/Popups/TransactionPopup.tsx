import React, { useContext } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { TYPE } from 'theme'
import { ExternalLink } from 'theme/components'
import { getExplorerLink } from 'utils'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'
import { TokenAmount, Trade } from 'sdk'
import { WrappedTokenInfo } from 'state/lists/hooks'
import { TokenInfo } from '@uniswap/token-lists'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

const LinkButton = styled.a`
  color: ${({ theme }) => theme.blue2};
  text-decoration: none;

  :hover,
  :focus {
    cursor: pointer;
    color: ${({ theme }) => theme.blue1};
  }
`

export default function TransactionPopup({
  hash,
  success,
  summary,
  trade,
}: {
  hash: string
  success?: boolean
  summary?: string
  trade?: Trade
}) {
  const { chainId } = useActiveWeb3React()
  const isMetamask = window.ethereum && window.ethereum.isMetaMask

  const theme = useContext(ThemeContext)

  const withRecipient = summary?.match(' to ')
  const token =
    trade?.outputAmount instanceof TokenAmount &&
    trade?.outputAmount?.token instanceof WrappedTokenInfo &&
    trade?.outputAmount?.token

  const showAddTokenButton = isMetamask && !withRecipient

  const addTokenToMetamask = ({ address, symbol, decimals, logoURI = '' }: TokenInfo) => {
    try {
      window.ethereum
        ?.request?.({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol,
              decimals,
              image: logoURI,
            },
          },
        })
        .then((wasAdded: boolean) => {
          if (wasAdded) {
            /* ok */
          }
        })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {success ? <CheckCircle color={theme.green1} size={24} /> : <AlertCircle color={theme.red1} size={24} />}
      </div>
      <AutoColumn gap="8px">
        <TYPE.body fontWeight={500}>{summary ?? 'Hash: ' + hash.slice(0, 8) + '...' + hash.slice(58, 65)}</TYPE.body>
        {showAddTokenButton && !!token && (
          <LinkButton theme={theme} onClick={() => addTokenToMetamask(token.tokenInfo)}>
            {`Add ${token.tokenInfo.symbol} to Metamask`}
          </LinkButton>
        )}
        {chainId && <ExternalLink href={getExplorerLink(chainId, hash, 'transaction')}>View in Explorer</ExternalLink>}
      </AutoColumn>
    </RowNoFlex>
  )
}
