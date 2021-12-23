import React, { useState } from 'react'
import styled from 'styled-components'
import { Box } from 'rebass'
import { Input } from '@rebass/forms'
import { CleanButton, ButtonAdd } from 'components/Button'
import { RiCloseFill } from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import Accordion from '../Accordion'

const List = styled.ul`
  margin: 0;
  padding: 0.4rem;
  list-style: none;
`

const Item = styled.li`
  padding: 0.2rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Overflow = styled.span`
  overflow-x: auto;
`

const RemoveButton = styled(CleanButton)`
  width: auto;
  padding: 0.3rem;
`

const NewItemWrapper = styled(Box)`
  display: flex;
  align-items: center;
`

const NewItemInput = styled(Input)<{ error?: boolean }>`
  border-radius: 0.5rem;
  margin-right: 0.4rem !important;
  ${({ error, theme }) => (error ? `border: 2px solid ${theme.red2} !important;` : '')}
`

export type LinkItem = {
  name: string
  source: string
}

export default function MenuLinksFactory({
  title,
  items,
  isValidItem,
  setItems,
}: {
  title: string
  setItems: (callback: any) => void
  isValidItem: (item: LinkItem) => boolean
  items: LinkItem[]
}) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState<string>('')
  const [newSource, setNewSource] = useState<string>('')
  const [itemError, setItemError] = useState<boolean>(false)

  const onRemove = (targetIndex: number) => {
    setItems((prevItems: LinkItem[]) => prevItems.filter((_, index) => index !== targetIndex))
  }

  const onAdd = () => {
    const newItem = {
      name: newName,
      source: newSource,
    }

    if (isValidItem(newItem)) {
      setItems((prevItems: LinkItem[]) => [...prevItems, newItem])
      setNewName('')
      setNewSource('')
    } else {
      setItemError(true)
    }
  }

  return (
    <Accordion title={title}>
      <List>
        {items.map(({ name, source }, index) => (
          <Item key={index}>
            <Overflow>
              {name}: {source}
            </Overflow>
            <RemoveButton type="button" onClick={() => onRemove(index)} title={t('remove')}>
              <RiCloseFill />
            </RemoveButton>
          </Item>
        ))}
      </List>

      <NewItemWrapper>
        <NewItemInput
          type="text"
          placeholder="Name"
          onChange={(event) => {
            setItemError(false)
            setNewName(event.target.value)
          }}
        />
        <NewItemInput
          error={itemError}
          type="text"
          placeholder="https://..."
          onChange={(event) => {
            setItemError(false)
            setNewSource(event.target.value)
          }}
        />

        <ButtonAdd onClick={onAdd} disabled={!newName || !newSource} />
      </NewItemWrapper>
    </Accordion>
  )
}
