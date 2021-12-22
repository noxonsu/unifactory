import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Box, Button } from 'rebass'
import { Input } from '@rebass/forms'
import { CleanButton } from 'components/Button'
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

const NewItemInput = styled(Input)<{ error: boolean }>`
  border-radius: 0.5rem;
  margin-right: 0.4rem !important;
  ${({ error, theme }) => (error ? `border: 2px solid ${theme.red2} !important;` : '')}
`

export default function ListFactory({
  title,
  placeholder,
  onItemChange,
  isValidItem,
  startItems,
}: {
  title: string
  onItemChange: (items: string[]) => void
  isValidItem: (item: string) => boolean
  startItems: string[]
  placeholder?: string
}) {
  const { t } = useTranslation()

  const [items, setItems] = useState<string[]>(startItems)
  const [newItem, setNewItem] = useState<string>('')
  const [itemError, setItemError] = useState<boolean>(false)

  useEffect(() => onItemChange(items), [items])
  useEffect(() => setItems(startItems), [startItems])

  const onRemove = (targetIndex: number) => {
    setItems((prevItems) => prevItems.filter((_, index) => index !== targetIndex))
  }

  const onNewItemChange = (event: any) => {
    setItemError(false)
    setNewItem(event.target.value)
  }

  const onAdd = () => {
    if (isValidItem(newItem)) {
      setItems((prevItems) => [...prevItems, newItem])
      setNewItem('')
    } else {
      setItemError(true)
    }
  }

  return (
    <Accordion title={title}>
      <List>
        {items.map((item, index) => (
          <Item key={index}>
            <Overflow>{item}</Overflow>
            <RemoveButton type="button" onClick={() => onRemove(index)} title="Remove item">
              <RiCloseFill />
            </RemoveButton>
          </Item>
        ))}
      </List>

      <NewItemWrapper>
        <NewItemInput error={itemError} type="text" placeholder={placeholder || ''} onChange={onNewItemChange} />
        <Button variant="primary" onClick={onAdd} disabled={!newItem}>
          {t('add')}
        </Button>
      </NewItemWrapper>
    </Accordion>
  )
}
