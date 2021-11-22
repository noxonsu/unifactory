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
  const { pending, setPending, setError } = props

  return (
    <section>
      <Form.Label htmlFor="logoUrlInput">Logo url</Form.Label>
      <InputGroup className="mb-3">
        <FormControl id="logoUrlInput" />
      </InputGroup>

      <Form.Label htmlFor="brandColorInput">Brand color</Form.Label>
      <InputGroup className="mb-5">
        <Form.Control
          type="color"
          id="brandColorInput"
          defaultValue="#3268a8"
          title="Choose your color"
        />
      </InputGroup>

      <h5 className="mb-3">Token list settings</h5>

      <TokenList />
    </section>
  )
}
