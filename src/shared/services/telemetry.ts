import axios from 'axios'
import { feedbackUrl } from '../../constants/onout'

export enum STATUS {
  danger = 1,
  success,
  warning,
  attention,
  unimportant,
}

const MARKS = {
  [STATUS.danger]: '⭕',
  [STATUS.success]: '🟢',
  [STATUS.warning]: '🔥',
  [STATUS.attention]: '💥',
  [STATUS.unimportant]: '💤',
}

export const feedback = ({ msg, status }: { msg: string; status?: STATUS }) => {
  let host = window.location.hostname || document.location.host

  if (host === 'localhost' || !feedbackUrl) return

  const statusMark =
    host === 'localhost' ? `${MARKS[STATUS.unimportant]} ` : status && MARKS[status] ? `${MARKS[status]} ` : ''

  const textToSend = [statusMark, `[${host}] `, msg].join('')

  try {
    axios({
      url: `${feedbackUrl}?msg=${encodeURI(textToSend)}&toonoutdev=1&version=2`,
      method: 'post',
    }).catch((e) => console.error(e))
  } catch (error) {
    console.error(error)
  }
}

export default {
  feedback,
}
