import axios from 'axios'
import { ethers } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { Addition, originUrl, onoutFeeAddress } from '../../constants/onout'
import { getCurrentDomain } from 'utils/app'
import crypto from 'utils/crypto'

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

const feedback = ({ msg, status }: { msg: string; status?: FeedbackStatus }) => {
  const host = getCurrentDomain()

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
  onComplete?: (args: { hash: string; isSuccess: boolean }) => void
}

const SUCCESSFUL_TX_STATUS = 1

const sendTx = async ({
  library,
  from,
  to,
  cryptoAmount,
}: TxProps): Promise<{
  hash: string
  isSuccess: boolean
}> => {
  try {
    const signer = library.getSigner()
    const txWithoutGasLimit = {
      to,
      from,
      value: ethers.utils.parseEther(cryptoAmount),
    }
    const percentToAddToGasLimit = 5
    const gasLimit = (await signer.estimateGas(txWithoutGasLimit)).mul(100 + percentToAddToGasLimit).div(100)
    const tx = { ...txWithoutGasLimit, gasLimit }
    const res = await signer.sendTransaction(tx)

    const txReceipt = await res.wait()

    return { hash: res.hash, isSuccess: txReceipt.status === SUCCESSFUL_TX_STATUS }
  } catch (error) {
    console.group('%c sendTx', 'color: red;')
    console.error(error)
    console.groupEnd()
    throw error
  }
}

const payment = async ({
  forWhat,
  library,
  from,
  cryptoAmount,
  onComplete,
}: TxProps & { forWhat: string }): Promise<void> => {
  try {
    const result = await sendTx({ library, from, to: onoutFeeAddress, cryptoAmount })

    if (onComplete) onComplete(result)

    feedback({
      msg: `Payment (${forWhat}); Success (${result.isSuccess}); TX: ${result.hash};`,
      status: FeedbackStatus.payment,
    })
  } catch (error) {
    console.error(error)
  }
}

const generateAdditionKey = ({ addition, account }: { addition: Addition; account: string }): string => {
  return crypto.generateHash(`${addition}-${account}`)
}

export default {
  feedback,
  payment,
  generateAdditionKey,
}
