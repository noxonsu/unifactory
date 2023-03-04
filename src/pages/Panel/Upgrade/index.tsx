import React, { FC, useMemo } from 'react'
import { useActiveWeb3React } from 'hooks'
import { useAppState } from 'state/application/hooks'
import TextBlock from 'components/TextBlock'
import { Addition } from '../../../constants/onout'
import crypto from 'utils/crypto'
import AdditionBlock from './AdditionBlock'

const adds = {
  [Addition.disabledCopyright]: false,
  [Addition.fullVersion]: false,
}

const Upgrade: FC = () => {
  const { account } = useActiveWeb3React()
  const { additions } = useAppState()

  const verifiedAdds = useMemo((): Record<Addition, boolean> => {
    if (Object.keys(additions).length && account) {
      if (
        additions[Addition.disabledCopyright] === crypto.generateMd5Hash(`${Addition.disabledCopyright}-${account}`)
      ) {
        adds[Addition.disabledCopyright] = true
      }
      if (additions[Addition.fullVersion] === crypto.generateMd5Hash(`${Addition.fullVersion}-${account}`)) {
        adds[Addition.fullVersion] = true
      }
    }

    return adds
  }, [additions, account])

  return (
    <div>
      {verifiedAdds[Addition.fullVersion] ? (
        <p>You have a full version</p>
      ) : (
        <>
          {verifiedAdds[Addition.disabledCopyright] ? (
            <TextBlock>You paid for copyright</TextBlock>
          ) : (
            <AdditionBlock
              name="Toggle Onout copyright"
              description="You can disable Onout copyright"
              cryptoCost={1}
              usdCost={500}
              onBuy={() => {
                console.log('Start payment')
              }}
            />
          )}
          <AdditionBlock
            name="Full version"
            description="You will be able to disable Onout commission and get access to other paid functions"
            cryptoCost={2}
            usdCost={1000}
            onBuy={() => {
              console.log('Start payment')
            }}
          />
        </>
      )}
    </div>
  )
}

export default Upgrade
