import { useState } from 'react'
import { useAccount, useChainId, useWriteContract, usePublicClient } from 'wagmi'
import { parseUnits, type Hex } from 'viem'
import { useStorageConfig } from '../../hooks/useStorageConfig'
import { isV3Mode } from '../../storage/types'

// NonfungiblePositionManager ABI (mint only)
const POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'amount0Desired', type: 'uint256' },
          { name: 'amount1Desired', type: 'uint256' },
          { name: 'amount0Min', type: 'uint256' },
          { name: 'amount1Min', type: 'uint256' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Default tick range for full range position
const TICK_LOWER = -887220
const TICK_UPPER = 887220

const cardCls = 'bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-auto shadow-sm'
const inputCls = 'w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700'
const labelCls = 'text-xs text-gray-500 dark:text-gray-400 mb-1 block'
const warnCls = 'p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-xl text-sm text-yellow-700 dark:text-yellow-300'

export default function PoolWidget() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { config } = useStorageConfig()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const [token0, setToken0] = useState('')
  const [token1, setToken1] = useState('')
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [fee, setFee] = useState(3000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const contracts = config?.contracts?.[String(chainId)] || {}
  const v3Available = isV3Mode(contracts)

  const handleAddLiquidity = async () => {
    if (!address) return
    if (!contracts.positionManager) {
      setError('NonfungiblePositionManager not configured. Add positionManager address in Admin.')
      return
    }

    setLoading(true)
    setError(null)
    setTxHash(null)

    try {
      const pm = contracts.positionManager as Hex
      const amt0 = parseUnits(amount0, 18)
      const amt1 = parseUnits(amount1, 18)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      // Approve both tokens
      await writeContractAsync({
        address: token0 as Hex,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [pm, amt0],
      })
      await writeContractAsync({
        address: token1 as Hex,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [pm, amt1],
      })

      const hash = await writeContractAsync({
        address: pm,
        abi: POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [
          {
            token0: token0 as Hex,
            token1: token1 as Hex,
            fee,
            tickLower: TICK_LOWER,
            tickUpper: TICK_UPPER,
            amount0Desired: amt0,
            amount1Desired: amt1,
            amount0Min: BigInt(0),
            amount1Min: BigInt(0),
            recipient: address,
            deadline,
          },
        ],
      })

      setTxHash(hash)
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Add liquidity failed')
    } finally {
      setLoading(false)
    }
  }

  if (!contracts.router) {
    return (
      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity</h2>
        <div className={warnCls}>
          DEX contracts not configured for this domain. Go to{' '}
          <a href="#/admin" className="underline">Admin</a> to set up.
        </div>
      </div>
    )
  }

  if (!v3Available) {
    return (
      <div className={cardCls}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity</h2>
        <div className={warnCls}>
          V2 mode. Liquidity pools require V3 contracts (QuoterV2 + NonfungiblePositionManager).
          Add <strong>Quoter</strong> and <strong>Position Manager</strong> in{' '}
          <a href="#/admin" className="underline">Admin</a>.
        </div>
      </div>
    )
  }

  const hasPositionManager = !!contracts.positionManager

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 max-w-md w-full mx-auto shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity (V3)</h2>
      <p className="text-xs text-gray-500 mb-4">Full-range position. Tokens ordered: token0 &lt; token1 by address.</p>

      {!hasPositionManager && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-xl text-xs text-yellow-700 dark:text-yellow-300">
          NonfungiblePositionManager not configured. Add it in{' '}
          <a href="#/admin" className="underline">Admin</a>.
          <div className="mt-1 text-yellow-600 dark:text-yellow-500 font-mono text-xs">
            BSC Testnet: 0x427bF5b37357632377eCbEC9de3626C71A5396c1
          </div>
          <div className="mt-0.5 text-yellow-600 dark:text-yellow-500 font-mono text-xs">
            BSC Mainnet: 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className={labelCls}>Token 0 address</label>
          <input
            value={token0}
            onChange={(e) => setToken0(e.target.value)}
            placeholder="0x..."
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Amount 0</label>
          <input
            type="number"
            value={amount0}
            onChange={(e) => setAmount0(e.target.value)}
            placeholder="0.0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Token 1 address</label>
          <input
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
            placeholder="0x..."
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Amount 1</label>
          <input
            type="number"
            value={amount1}
            onChange={(e) => setAmount1(e.target.value)}
            placeholder="0.0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Fee tier</label>
          <select
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className={inputCls}
          >
            <option value={500}>0.05%</option>
            <option value={3000}>0.3%</option>
            <option value={10000}>1%</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-sm text-red-600 dark:text-red-300">{error}</div>
      )}
      {txHash && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-xl text-sm text-green-700 dark:text-green-300">
          Position minted!{' '}
          <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">
            View TX
          </a>
        </div>
      )}

      <button
        onClick={handleAddLiquidity}
        disabled={!isConnected || !token0 || !token1 || !amount0 || !amount1 || loading || !hasPositionManager}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors"
      >
        {loading
          ? 'Adding...'
          : !isConnected
          ? 'Connect Wallet'
          : !hasPositionManager
          ? 'Position Manager Not Configured'
          : 'Add Liquidity'}
      </button>
    </div>
  )
}
