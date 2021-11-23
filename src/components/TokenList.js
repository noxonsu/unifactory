import { useState, useEffect } from 'react'
import {
  Button,
  InputGroup,
  FormControl,
  Row,
  Col,
  Alert,
  ListGroup,
  Accordion,
} from 'react-bootstrap'

export function TokenList(props) {
  const { list } = props

  return (
    <ListGroup className={`${list.tokens.length > 8 ? 'scrollableList' : ''}`}>
      {list.map((item, index) => {
        const { name, address } = item

        return (
          <ListGroup.Item key={index} variant="light">
            <b>{name}</b>: {address}
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}
