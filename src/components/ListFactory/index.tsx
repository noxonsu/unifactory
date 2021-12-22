import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 1rem;
  border: 1px solid blue;
`

const Title = styled.h4`
  font-weight: 500;
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
    <Wrapper>
      <Title>{title}</Title>

      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <span>{item}</span>
            <button onClick={() => onRemove(index)}>remove</button>
          </li>
        ))}
      </ul>

      <div>
        <input
          className={`${itemError ? 'error' : ''}`}
          type="text"
          onChange={onNewItemChange}
          placeholder={placeholder || ''}
        />
        <button onClick={onAdd} disabled={!newItem}>
          add item
        </button>
      </div>
    </Wrapper>
  )
}
