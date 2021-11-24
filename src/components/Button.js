import { Button as BSButton } from 'react-bootstrap'

export function Button(props) {
  const { onClick, pending, children, disabled } = props

  return (
    <BSButton variant="primary" onClick={onClick} disabled={disabled}>
      {pending ? (
        <>
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>{' '}
          Pending
        </>
      ) : (
        children
      )}
    </BSButton>
  )
}
