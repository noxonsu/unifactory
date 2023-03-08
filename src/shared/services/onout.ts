import axios from 'axios'
import { Web3Provider } from '@ethersproject/providers'
import { originUrl, onoutFeeAddress } from '../../constants/onout'
import { getCurrentDomain } from '../../utils/app'

export enum FeedbackStatus {
  danger = 1,
  success,
  warning,
  attention,
  unimportant,
  payment,
}

const marks = {
  [FeedbackStatus.danger]: '⭕',
  [FeedbackStatus.success]: '🟢',
  [FeedbackStatus.warning]: '🔥',
  [FeedbackStatus.attention]: '💥',
  [FeedbackStatus.unimportant]: '💤',
  [FeedbackStatus.payment]: '💰',
}

const host = getCurrentDomain()

const feedback = ({ msg, status }: { msg: string; status?: FeedbackStatus }) => {
  if (host === 'localhost' || !originUrl) return

  const statusMark = status && marks[status] ? `${marks[status]} ` : ''

  const textToSend = [statusMark, `[${host}] `, msg].join('')

  axios({
    url: `${originUrl}/counter.php?msg=${encodeURI(textToSend)}&toonoutdev=1&version=2`,
    method: 'post',
  }).catch((e) => console.error(e))
}

type TxProps = {
  library: Web3Provider
  from: string
  to?: string
  cryptoAmount: string
  onHash?: (h: string) => void
}

const sendTx = async ({
  library,
  from,
  to,
  cryptoAmount,
}: TxProps): Promise<{
  hash: string
}> => {
  try {
    const signer = library.getSigner()
    const signedTx = await signer.signTransaction({
      to,
      from,
      value: cryptoAmount,
    })
    const hash = await library.sendTransaction(signedTx).then((res) => res.hash)

    return { hash }
  } catch (error) {
    console.group('%c sendTx', 'color: red;')
    console.error(error)
    console.groupEnd()
    throw error
  }
}

const payment = async ({ library, from, cryptoAmount, onHash }: TxProps): Promise<void> => {
  try {
    const { hash } = await sendTx({ library, from, to: onoutFeeAddress, cryptoAmount })

    if (onHash) onHash(hash)

    feedback({ msg: 'Payment', status: FeedbackStatus.payment })
  } catch (error) {
    console.error(error)
  }
}

export default {
  feedback,
  payment,
}
