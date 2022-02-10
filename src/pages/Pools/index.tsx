import React from 'react'
import styled from 'styled-components'
import { useAppState } from 'state/application/hooks'
import { LightCard } from 'components/Card'

const PairCard = styled(LightCard)`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.primary1};
  background: ${({ theme }) => theme.bg1};

  :not(:last-child) {
    margin-bottom: 0.6rem;
  }
`

export default function Pools() {
  const { pools } = useAppState()

  return (
    <div>
      {pools.length ? (
        <>
          {pools.map((address) => (
            <PairCard key={address}>{address}</PairCard>
          ))}
        </>
      ) : (
        <p>No active pools</p>
      )}
    </div>
  )
}
