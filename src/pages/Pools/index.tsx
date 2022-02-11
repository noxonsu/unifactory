import React, { useEffect, useState } from 'react'
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
  border: 1px solid ${({ theme }) => theme.primary1};
  background: ${({ theme }) => theme.bg1};

  :not(:last-child) {
    margin-bottom: 0.6rem;
  }
`

const toInterfaceFormat = (n: BigNumber) => new BigNumber(n.toString()).div(10 ** 18).toString()

const Pool = ({
  address,
  tokens,
  wrappedToken,
}: {
  address: string
  update: boolean
  tokens: any[]
  wrappedToken: any
}) => {
  const pair = usePairContract(address)

  const [token0, setToken0] = useState(undefined)
  const [token1, setToken1] = useState(undefined)
  const [reservesInfo, setReservesInfo] = useState<[BigNumber, BigNumber, number] | undefined>(undefined)

  const setCorrectToken = (address: string, set: (token: any) => void) => {
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
  }

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
  }, [])

  return (
    <PairCard>
      {/* @ts-ignore */}
      <CurrencyLogo currency={token0} /> {token0 && token0?.name}
      {/* @ts-ignore */}
      {reservesInfo && <p>{token0 && token0?.symbol} reserve: {toInterfaceFormat(reservesInfo[0])}</p>}
      <hr />
      {/* @ts-ignore */}
      <CurrencyLogo currency={token1} /> {token1 && token1?.name}
      {/* @ts-ignore */}
      {reservesInfo && <p>{token1 && token1?.symbol} reserve: {toInterfaceFormat(reservesInfo[1])}</p>}
    </PairCard>
  )
}

export default function Pools() {
  const { pools } = useAppState()
  const [update, setUpdate] = useState(false)
  const wrappedToken = useWrappedToken()
  const tokens = useAppTokens()

  return (
    <div>
      <button onClick={() => setUpdate((prevState) => !prevState)}>Update pools</button>

      {pools.length ? (
        <>
          {pools.map((address) => (
            <Pool key={address} address={address} update={update} tokens={tokens} wrappedToken={wrappedToken} />
          ))}
        </>
      ) : (
        <p>No active pools</p>
      )}
    </div>
  )
}
