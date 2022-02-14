import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { useAppState } from 'state/application/hooks'
import { usePairContract } from 'hooks/useContract'
import { useWrappedToken } from 'hooks/useToken'
import { useAppTokens } from 'hooks/Tokens'
import { LightCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import { BigNumber } from 'bignumber.js'

const PairCard = styled(LightCard)`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.text5};
  background: ${({ theme }) => theme.bg1};

  :not(:last-child) {
    margin-bottom: 0.6rem;
  }

  .top {
    display: flex;
    align-items: center;

    .symbol {
      font-weight: 500;
      padding: 0.5rem;
    }
  }
`

const toInterfaceFormat = (n: BigNumber) => new BigNumber(n.toString()).div(10 ** 18).toString()

const Pool = ({ address, tokens, wrappedToken }: { address: string; tokens: any[]; wrappedToken: any }) => {
  const pair = usePairContract(address)

  const [token0, setToken0] = useState(undefined)
  const [token1, setToken1] = useState(undefined)
  const [reservesInfo, setReservesInfo] = useState<[BigNumber, BigNumber, number] | undefined>(undefined)

  const setCorrectToken = useCallback(
    (address: string, set: (token: any) => void) => {
      if (address === wrappedToken.address) {
        set(wrappedToken)
      } else {
        const token = tokens.find((token: any) => token.address === address)

        set(
          token
            ? token
            : {
                name: 'Unknown',
              }
        )
      }
    },
    [tokens, wrappedToken]
  )

  useEffect(() => {
    const update = async () => {
      if (pair) {
        const address0 = await pair.token0()
        const address1 = await pair.token1()
        const info = await pair.getReserves()

        setReservesInfo(info)
        setCorrectToken(address0, setToken0)
        setCorrectToken(address1, setToken1)
      }
    }

    update()
  }, [pair, setCorrectToken])

  return (
    <PairCard>
      <div className="top">
        <CurrencyLogo currency={token0} />
        <CurrencyLogo currency={token1} /> {/* @ts-ignore */}
        {token0 && <span className="symbol">{token0?.symbol || '(?)'}</span>} / {/* @ts-ignore */}
        {token1 && <span className="symbol">{token1?.symbol || '(?)'}</span>}
      </div>

      {reservesInfo && (
        <>
          {toInterfaceFormat(reservesInfo[0])} / {toInterfaceFormat(reservesInfo[1])}
        </>
      )}
    </PairCard>
  )
}

export default function Pools() {
  const { pools } = useAppState()
  const wrappedToken = useWrappedToken()
  const tokens = useAppTokens()

  return (
    <div>
      {pools.length ? (
        <>
          {pools.map((address) => (
            <Pool key={address} address={address} tokens={tokens} wrappedToken={wrappedToken} />
          ))}
        </>
      ) : (
        <p>No active pools</p>
      )}
    </div>
  )
}
