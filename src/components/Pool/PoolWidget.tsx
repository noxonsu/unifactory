import { useState, useRef, useEffect } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { parseUnits, type Hex } from 'viem'
import { useStorageConfig } from '../../hooks/useStorageConfig'
import { isV3Mode } from '../../storage/types'
import TokenInput from '../Swap/TokenInput'

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

const TICK_LOWER = -887220
const TICK_UPPER = 887220

const FEE_TIERS = [
  { value: 500, label: '0.05%', description: 'Best for stable pairs', badge: null },
  { value: 3000, label: '0.3%', description: 'Best for most pairs', badge: 'Most common' },
  { value: 10000, label: '1%', description: 'Best for exotic pairs', badge: null },
]

const DEFAULT_TOKENS = [
  { address: '0x703f112Bda4Cc6cb9c5FB4B2e6140f6D8374F10b', symbol: 'WEENUS', decimals: 18, logoURI: undefined as string | undefined },
  { address: '0x348236484ce96A293E210260b90bBFb228D6d1Fc', symbol: 'USDT', decimals: 6, logoURI: undefined as string | undefined },
]

// Token picker — just a selector button (no amount input)
interface Token { address: string; symbol: string; logoURI?: string }

function TokenIcon({ logoURI, symbol }: { logoURI?: string; symbol: string }) {
  const [failed, setFailed] = useState(false)
  // Reset failed state when logoURI changes (React reuses component instances)
  useEffect(() => { setFailed(false) }, [logoURI])
  if (logoURI && !failed) {
    return <img src={logoURI} alt={symbol} className="w-5 h-5 rounded-full flex-shrink-0" onError={() => setFailed(true)} />
  }
  return (
    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex-shrink-0 inline-flex items-center justify-center text-[8px] text-white font-bold">
      {symbol.slice(0, 2)}
    </span>
  )
}

function TokenPicker({ value, onChange, tokenList }: { value: string; onChange: (a: string) => void; tokenList: Token[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? tokenList.find((t) => t.address.toLowerCase() === value.toLowerCase()) : undefined

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      {tokenList.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl px-3 py-3 font-medium transition-colors border border-gray-200 dark:border-gray-700"
          >
            {selected ? (
              <TokenIcon logoURI={selected.logoURI} symbol={selected.symbol} />
            ) : (
              <span className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 inline-flex items-center justify-center text-[9px] text-gray-500 dark:text-gray-400 font-bold">?</span>
            )}
            <span className="flex-1 text-left text-sm truncate min-w-0">{selected?.symbol ?? 'Select'}</span>
            <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {open && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-auto max-h-52 shadow-xl">
              {tokenList.map((t) => (
                <button
                  key={t.address}
                  type="button"
                  onClick={() => { onChange(t.address); setOpen(false) }}
                  className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    t.address.toLowerCase() === value.toLowerCase() ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <TokenIcon logoURI={t.logoURI} symbol={t.symbol} />
                  <div className="min-w-0">
                    <div className="text-gray-900 dark:text-white font-medium">{t.symbol}</div>
                    <div className="text-gray-400 text-xs font-mono truncate">{t.address.slice(0, 6)}…{t.address.slice(-4)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Token address 0x..."
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 outline-none"
        />
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{children}</p>
}

export default function PoolWidget() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { config } = useStorageConfig()
  const { writeContractAsync } = useWriteContract()

  const [token0, setToken0] = useState('')
  const [token1, setToken1] = useState('')
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [fee, setFee] = useState(3000)
  const [fullRange, setFullRange] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const contracts = config?.contracts?.[String(chainId)] || {}
  const v3Available = isV3Mode(contracts)
  const hasPositionManager = !!contracts.positionManager

  // Build token list from Storage config
  const tokenList = (() => {
    const lists = config?.tokenLists?.[String(chainId)]
    if (!lists) return DEFAULT_TOKENS
    const tokens: typeof DEFAULT_TOKENS = []
    Object.values(lists).forEach((list: any) => {
      if (list?.tokens) {
        list.tokens.forEach((t: any) => {
          if (!tokens.find((x) => x.address.toLowerCase() === t.address?.toLowerCase())) {
            tokens.push({ address: t.address, symbol: t.symbol, decimals: t.decimals ?? 18, logoURI: t.logoURI })
          }
        })
      }
    })
    return tokens.length > 0 ? tokens : DEFAULT_TOKENS
  })()

  const getTokenDecimals = (addr: string) =>
    tokenList.find((t) => t.address.toLowerCase() === addr.toLowerCase())?.decimals ?? 18

  // Auto-select preferred default tokens when list loads: USDT + WBTC (or first two)
  const PREFERRED = ['USDT', 'WBTC']
  useEffect(() => {
    if (tokenList.length < 2) return
    const findBySymbol = (sym: string) => tokenList.find((t) => t.symbol.toUpperCase() === sym)
    const pick0 = findBySymbol(PREFERRED[0]) ?? tokenList[0]
    const pick1 = findBySymbol(PREFERRED[1]) ?? tokenList.find((t) => t.address !== pick0.address) ?? tokenList[1]
    setToken0((prev) => prev || pick0.address)
    setToken1((prev) => prev || pick1.address)
  }, [tokenList.length]) // re-run when list first populates

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
      const amt0 = parseUnits(amount0, getTokenDecimals(token0))
      const amt1 = parseUnits(amount1, getTokenDecimals(token1))
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

      await writeContractAsync({ address: token0 as Hex, abi: ERC20_ABI, functionName: 'approve', args: [pm, amt0] })
      await writeContractAsync({ address: token1 as Hex, abi: ERC20_ABI, functionName: 'approve', args: [pm, amt1] })

      const hash = await writeContractAsync({
        address: pm,
        abi: POSITION_MANAGER_ABI,
        functionName: 'mint',
        args: [{
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
        }],
      })
      setTxHash(hash)
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Add liquidity failed')
    } finally {
      setLoading(false)
    }
  }

  // Not configured
  if (!contracts.router) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-auto shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity</h2>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl text-sm text-yellow-700 dark:text-yellow-300">
          DEX contracts not configured for this domain. Go to{' '}
          <a href="#/admin" className="underline font-medium">Admin</a> to set up.
        </div>
      </div>
    )
  }

  if (!v3Available) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-auto shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Liquidity</h2>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl text-sm text-yellow-700 dark:text-yellow-300">
          V2 mode. Liquidity pools require V3 contracts (QuoterV2 + NonfungiblePositionManager).
          Add <strong>Quoter</strong> and <strong>Position Manager</strong> in{' '}
          <a href="#/admin" className="underline font-medium">Admin</a>.
        </div>
      </div>
    )
  }

  const canSubmit = isConnected && token0 && token1 && amount0 && amount1 && !loading && hasPositionManager

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-auto shadow-sm overflow-visible">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Liquidity</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">V3</span>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* 1. Select Pair */}
        <div>
          <SectionLabel>Select pair</SectionLabel>
          <div className="flex items-center gap-2">
            <TokenPicker value={token0} onChange={setToken0} tokenList={tokenList} />
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-lg font-medium">+</div>
            <TokenPicker value={token1} onChange={setToken1} tokenList={tokenList} />
          </div>
        </div>

        {/* 2. Fee Tier */}
        <div>
          <SectionLabel>Fee tier</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {FEE_TIERS.map((tier) => {
              const active = fee === tier.value
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setFee(tier.value)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-3 border transition-all text-center ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white rounded-full px-1.5 py-0.5 whitespace-nowrap font-medium">
                      {tier.badge}
                    </span>
                  )}
                  <span className={`text-sm font-semibold ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {tier.label}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tier.description}</span>
                  {active && (
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Price Range */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Price range</SectionLabel>
            <button
              type="button"
              onClick={() => setFullRange(true)}
              className={`text-xs px-3 py-1 rounded-xl font-medium transition-colors ${
                fullRange
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              Full range
            </button>
          </div>

          {fullRange ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">Your position will cover the entire price range</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">0 ↔ ∞</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[{ label: 'Min price', placeholder: '0' }, { label: 'Max price', placeholder: '∞' }].map(({ label, placeholder }) => (
                <div key={label} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                  <input
                    type="number"
                    defaultValue=""
                    placeholder={placeholder}
                    className="w-full bg-transparent text-gray-900 dark:text-white text-center text-sm font-medium outline-none placeholder-gray-300 dark:placeholder-gray-600"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Token1 per Token0</p>
                </div>
              ))}
            </div>
          )}

          {!fullRange && (
            <button
              type="button"
              onClick={() => setFullRange(false)}
              className="mt-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              Switch to custom range
            </button>
          )}
        </div>

        {/* 4. Deposit Amounts */}
        <div>
          <SectionLabel>Deposit amounts</SectionLabel>
          {!hasPositionManager && (
            <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl text-xs text-yellow-700 dark:text-yellow-300">
              Position Manager not configured.{' '}
              <a href="#/admin" className="underline font-medium">Add in Admin</a>
              <span className="block mt-1 font-mono text-yellow-600 dark:text-yellow-500">BSC Testnet: 0x427b…96c1</span>
            </div>
          )}
          <div className="space-y-2">
            <TokenInput
              label=""
              value={amount0}
              onChange={setAmount0}
              tokenAddress={token0}
              onTokenChange={setToken0}
              tokenList={tokenList}
            />
            <TokenInput
              label=""
              value={amount1}
              onChange={setAmount1}
              tokenAddress={token1}
              onTokenChange={setToken1}
              tokenList={tokenList}
            />
          </div>
        </div>

        {/* Errors / Success */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        {txHash && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-2xl text-sm text-green-700 dark:text-green-300">
            Position minted!{' '}
            <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
              View TX
            </a>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="px-5 pt-4 pb-5">
        <button
          onClick={handleAddLiquidity}
          disabled={!canSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors text-base"
        >
          {loading
            ? 'Adding liquidity...'
            : !isConnected
            ? 'Connect wallet'
            : !hasPositionManager
            ? 'Position Manager not configured'
            : !amount0 || !amount1
            ? 'Enter amounts'
            : 'Add liquidity'}
        </button>
      </div>
    </div>
  )
}
