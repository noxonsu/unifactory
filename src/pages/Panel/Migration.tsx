import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveWeb3React } from 'hooks'
import InputPanel from 'components/InputPanel'
import { ButtonPrimary } from 'components/Button'
import TextBlock from 'components/TextBlock'
import { OptionWrapper } from './index'
import { migrateToNewDomain } from 'utils/storage'
import { getCurrentDomain } from 'utils/app'
import { DOMAIN_REGEXP } from '../../constants'

export default function Migration() {
  const { library, account } = useActiveWeb3React()
  const { t } = useTranslation()
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

    try {
      const result = await migrateToNewDomain({
        oldDomain,
        newDomain,
        library,
        owner: account,
      })

      console.log('result', result)
    } catch (error) {
      console.error(error)
    }
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
      <ButtonPrimary onClick={startMigration} disabled={!canStartMigration}>
        {t('migrateToNewDomain')}
      </ButtonPrimary>
    </section>
  )
}
