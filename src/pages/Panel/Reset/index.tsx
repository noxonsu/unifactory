import React, { FC, useState } from 'react'
import { Text } from 'rebass'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useActiveWeb3React } from 'hooks'
import { resetAppData } from 'utils/storage'
import { ButtonError } from 'components/Button'
import ConfirmationModal from 'components/ConfirmationModal'

const DangerZone = styled.div`
  padding-top: 0.5rem;
`

type Props = {
  setDomainDataTrigger: (f: (state: boolean) => boolean) => void
}

const Reset: FC<Props> = ({ setDomainDataTrigger }) => {
  const { t } = useTranslation()
  const { account, library } = useActiveWeb3React()
  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  const resetData = async () => {
    setShowConfirm(false)

    await resetAppData({ library, owner: account || '' })

    setDomainDataTrigger((state: boolean) => !state)
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        content={() => (
          <>
            <Text fontWeight={500} fontSize={20}>
              {t('resetDomainDescription')}
            </Text>
            <ButtonError error padding={'12px'} onClick={resetData}>
              <Text fontSize={20} fontWeight={500} id="reset">
                {t('resetDomainData')}
              </Text>
            </ButtonError>
          </>
        )}
      />
      <DangerZone>
        <ButtonError error onClick={() => setShowConfirm(true)}>
          {t('resetDomainData')}
        </ButtonError>
      </DangerZone>
    </>
  )
}

export default Reset
