import { createStore, Store } from 'redux'
import { addTransaction, checkedTransaction, clearAllTransactions, finalizeTransaction } from './actions'
import reducer, { initialState, TransactionState } from './reducer'
import appConfig from '../../appConfig'

describe('transaction reducer', () => {
  let store: Store<TransactionState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('addTransaction', () => {
    it('adds the transaction', () => {
      const beforeTime = new Date().getTime()
      store.dispatch(
        addTransaction({
          chainId: appConfig.TESTNET.chainId,
          summary: 'hello world',
          hash: '0x0',
          approval: { tokenAddress: 'abc', spender: 'def' },
          from: 'abc',
        })
      )
      const txs = store.getState()
      expect(txs[appConfig.TESTNET.chainId]).toBeTruthy()
      expect(txs[appConfig.TESTNET.chainId]?.['0x0']).toBeTruthy()
      const tx = txs[appConfig.TESTNET.chainId]?.['0x0']
      expect(tx).toBeTruthy()
      expect(tx?.hash).toEqual('0x0')
      expect(tx?.summary).toEqual('hello world')
      expect(tx?.approval).toEqual({ tokenAddress: 'abc', spender: 'def' })
      expect(tx?.from).toEqual('abc')
      expect(tx?.addedTime).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('finalizeTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        finalizeTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1,
          },
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets receipt', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: appConfig.TESTNET.chainId,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0',
        })
      )
      const beforeTime = new Date().getTime()
      store.dispatch(
        finalizeTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          receipt: {
            status: 1,
            transactionIndex: 1,
            transactionHash: '0x0',
            to: '0x0',
            from: '0x0',
            contractAddress: '0x0',
            blockHash: '0x0',
            blockNumber: 1,
          },
        })
      )
      const tx = store.getState()[appConfig.TESTNET.chainId]?.['0x0']
      expect(tx?.summary).toEqual('hello world')
      expect(tx?.confirmedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(tx?.receipt).toEqual({
        status: 1,
        transactionIndex: 1,
        transactionHash: '0x0',
        to: '0x0',
        from: '0x0',
        contractAddress: '0x0',
        blockHash: '0x0',
        blockNumber: 1,
      })
    })
  })

  describe('checkedTransaction', () => {
    it('no op if not valid transaction', () => {
      store.dispatch(
        checkedTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      expect(store.getState()).toEqual({})
    })
    it('sets lastCheckedBlockNumber', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: appConfig.TESTNET.chainId,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[appConfig.TESTNET.chainId]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(1)
    })
    it('never decreases', () => {
      store.dispatch(
        addTransaction({
          hash: '0x0',
          chainId: appConfig.TESTNET.chainId,
          approval: { spender: '0x0', tokenAddress: '0x0' },
          summary: 'hello world',
          from: '0x0',
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          blockNumber: 3,
        })
      )
      store.dispatch(
        checkedTransaction({
          chainId: appConfig.TESTNET.chainId,
          hash: '0x0',
          blockNumber: 1,
        })
      )
      const tx = store.getState()[appConfig.TESTNET.chainId]?.['0x0']
      expect(tx?.lastCheckedBlockNumber).toEqual(3)
    })
  })

  describe('clearAllTransactions', () => {
    it('removes all transactions for the chain', () => {
      store.dispatch(
        addTransaction({
          chainId: appConfig.TESTNET.chainId,
          summary: 'hello world',
          hash: '0x0',
          approval: { tokenAddress: 'abc', spender: 'def' },
          from: 'abc',
        })
      )
      store.dispatch(
        addTransaction({
          chainId: appConfig.TESTNET.chainId,
          summary: 'hello world',
          hash: '0x1',
          approval: { tokenAddress: 'abc', spender: 'def' },
          from: 'abc',
        })
      )
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([
        String(appConfig.TESTNET.chainId),
        String(appConfig.TESTNET.chainId),
      ])
      expect(Object.keys(store.getState()[appConfig.TESTNET.chainId] ?? {})).toEqual(['0x0'])
      expect(Object.keys(store.getState()[appConfig.TESTNET.chainId] ?? {})).toEqual(['0x1'])
      store.dispatch(clearAllTransactions({ chainId: appConfig.TESTNET.chainId }))
      expect(Object.keys(store.getState())).toHaveLength(2)
      expect(Object.keys(store.getState())).toEqual([
        String(appConfig.TESTNET.chainId),
        String(appConfig.TESTNET.chainId),
      ])
      expect(Object.keys(store.getState()[appConfig.TESTNET.chainId] ?? {})).toEqual([])
      expect(Object.keys(store.getState()[appConfig.TESTNET.chainId] ?? {})).toEqual(['0x1'])
    })
  })
})
