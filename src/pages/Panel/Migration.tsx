import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useAddPopup } from 'state/application/hooks'
import InputPanel from 'components/InputPanel'
import { ButtonPrimary } from 'components/Button'
import TextBlock from 'components/TextBlock'
import { OptionWrapper } from './index'
import { migrateToNewDomain } from 'utils/storage'
import { getCurrentDomain } from 'utils/app'
import { DOMAIN_REGEXP } from '../../constants'
import { NumList } from './styled'

type Props = {
  pending: boolean
  setPending: (v: boolean) => void
}

export default function Migration(props: Props) {
  const { pending, setPending } = props
  const { library, account } = useActiveWeb3React()
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()
  const [oldDomain] = useState(getCurrentDomain())
  const [newDomain, setNewDomain] = useState('')
  const [isValidDomain, setIsValidDomain] = useState(false)
  const [canStartMigration, setCanStartMigration] = useState(false)

  useEffect(() => {
    if (!newDomain) return setIsValidDomain(true)

    setIsValidDomain(newDomain === 'localhost' || !!newDomain.match(DOMAIN_REGEXP))
  }, [newDomain])

  useEffect(() => {
    setCanStartMigration(Boolean(newDomain && isValidDomain && library && account))
  }, [newDomain, isValidDomain, library, account])

  const startMigration = async () => {
    if (!account) return

    setPending(true)

    try {
      const { hash } = await migrateToNewDomain({
        oldDomain,
        newDomain,
        library,
        owner: account,
      })

      if (hash) {
        addTransaction(
          { hash },
          {
            summary: t('descriptionOfEndOfMigration'),
          }
        )
      }
    } catch (error) {
      console.group('%c migration error', 'color: red')
      console.error(error)
      console.groupEnd()
      addPopup({
        error: {
          message: error.message,
          code: error.code,
        },
      })
    }

    setPending(false)
  }

  return (
    <section>
      <TextBlock type="warning">{t('afterMigrationYourDataWillBeDeleted')}</TextBlock>
      <OptionWrapper>
        <InputPanel label={`${t('oldDomain')}`} value={oldDomain} disabled />
      </OptionWrapper>
      <OptionWrapper>
        <InputPanel
          label={`${t('newDomain')}`}
          value={newDomain}
          onChange={setNewDomain}
          error={!!newDomain && !isValidDomain}
        />
      </OptionWrapper>
      <div>
        {t('youHaveToConfirmTheseTxs')}
        <NumList>
          <li>{t('saveDataForNewDomain')}</li>
          <li>{t('deleteDataForOldDomain')}</li>
        </NumList>
      </div>
      <ButtonPrimary onClick={startMigration} disabled={pending || !canStartMigration}>
        {t('migrateToNewDomain')}
      </ButtonPrimary>
    </section>
  )
}
