import {
  Container,
  Button,
  InputGroup,
  FormControl,
  Form,
  ListGroup,
} from 'react-bootstrap'
import { TokenList } from './TokenList'

export function InterfaceOptions(props) {
  const {} = props

  return (
    <section>
      <InputGroup className="mb-2">
        <FormControl placeholder="Logo url" />
      </InputGroup>

      <Form.Label htmlFor="brandColorInput">Brand color</Form.Label>
      <InputGroup>
        <Form.Control
          type="color"
          id="brandColorInput"
          defaultValue="#3268a8"
          title="Choose your color"
        />
      </InputGroup>

      <TokenList />
    </section>
  )
}