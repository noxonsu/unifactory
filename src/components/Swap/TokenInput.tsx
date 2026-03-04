import { useState, useRef, useEffect } from 'react'

interface Token {
  address: string
  symbol: string
  logoURI?: string
}

interface TokenInputProps {
  label: string
  value: string
  onChange?: (val: string) => void
  tokenAddress: string
  onTokenChange: (addr: string) => void
  tokenList: Token[]
  readOnly?: boolean
  loading?: boolean
}

function TokenIcon({ logoURI, symbol }: { logoURI?: string; symbol: string }) {
  const [failed, setFailed] = useState(false)
  if (logoURI && !failed) {
    return (
      <img
        src={logoURI}
        alt={symbol}
        className="w-5 h-5 rounded-full flex-shrink-0"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 inline-flex items-center justify-center text-[9px] text-gray-600 dark:text-gray-300 font-bold">
      {symbol.slice(0, 2)}
    </span>
  )
}

export default function TokenInput({
  label,
  value,
  onChange,
  tokenAddress,
  onTokenChange,
  tokenList,
  readOnly,
  loading,
}: TokenInputProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = tokenList.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={loading ? '' : value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          placeholder={loading ? 'Loading...' : '0.0'}
          className="flex-1 bg-transparent text-2xl font-medium text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min="0"
        />
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          {tokenList.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 cursor-pointer min-w-[110px] transition-colors shadow-sm"
              >
                {selected ? (
                  <TokenIcon logoURI={selected.logoURI} symbol={selected.symbol} />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex-shrink-0 inline-block" />
                )}
                <span className="flex-1 text-left truncate max-w-[70px]">
                  {selected?.symbol || 'Select'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-auto max-h-52 min-w-[160px] shadow-xl">
                  {tokenList.map((t) => (
                    <button
                      key={t.address}
                      type="button"
                      onClick={() => {
                        onTokenChange(t.address)
                        setOpen(false)
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                        t.address.toLowerCase() === tokenAddress.toLowerCase()
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : ''
                      }`}
                    >
                      <TokenIcon logoURI={t.logoURI} symbol={t.symbol} />
                      <div>
                        <div className="text-gray-900 dark:text-white font-medium">{t.symbol}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs font-mono">
                          {t.address.slice(0, 6)}…{t.address.slice(-4)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="Token address"
              className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 w-44"
            />
          )}
        </div>
      </div>
      {selected && (
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{selected.address}</div>
      )}
    </div>
  )
}
