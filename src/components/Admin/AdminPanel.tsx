import { useState } from 'react'
import { useAccount, useChainId, useWriteContract, useDeployContract, usePublicClient } from 'wagmi'
import { useStorageConfig } from '../../hooks/useStorageConfig'
import { saveAppData, STORAGE_BY_CHAIN, getCurrentDomain } from '../../storage/contract'
import { STORAGE_ABI, STORAGE_BYTECODE } from '../../storage/abi'

interface ChainContractsForm {
  factory: string
  router: string
  quoter: string
  positionManager: string
}

// All known public V3 presets (chain-agnostic list — user picks manually)
const V3_PRESETS: { id: string; dex: string; network: string; chainId: number; contracts: ChainContractsForm }[] = [
  {
    id: 'pcs-testnet',
    dex: 'PancakeSwap V3',
    network: 'BSC Testnet',
    chainId: 97,
    contracts: {
      factory:         '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      router:          '0x9a489505a00cE272eAa5e07Dba6491314CaE3796',
      quoter:          '0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2',
      positionManager: '0x427bF5b37357632377eCbEC9de3626C71A5396c1',
    },
  },
  {
    id: 'pcs-mainnet',
    dex: 'PancakeSwap V3',
    network: 'BSC Mainnet',
    chainId: 56,
    contracts: {
      factory:         '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      router:          '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
      quoter:          '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
      positionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
    },
  },
  {
    id: 'uni-eth',
    dex: 'Uniswap V3',
    network: 'Ethereum',
    chainId: 1,
    contracts: {
      factory:         '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router:          '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter:          '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      positionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    },
  },
]

const DEPLOY_GUIDE = `# Deploy your own V3 contracts

## Option 1: script (BSC Testnet)
PRIVATE_KEY=0x... node scripts/register-testnet.cjs

## Option 2: Hardhat / Foundry
https://github.com/Uniswap/v3-core — deploy Factory
https://github.com/Uniswap/v3-periphery — deploy Router, QuoterV2, NonfungiblePositionManager

## BSC Testnet faucet
https://testnet.bnbchain.org/faucet-smart`

export default function AdminPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { config, domain } = useStorageConfig()
  const { writeContractAsync } = useWriteContract()
  const { deployContractAsync } = useDeployContract()
  const publicClient = usePublicClient()

  const existingContracts = config?.contracts?.[String(chainId)] || {}

  const [contracts, setContracts] = useState<ChainContractsForm>({
    factory:         (existingContracts.factory as string) || '',
    router:          (existingContracts.router as string) || '',
    quoter:          (existingContracts.quoter as string) || '',
    positionManager: (existingContracts.positionManager as string) || '',
  })
  const [branding, setBranding] = useState({
    projectName: config?.projectName || '',
    brandColor:  config?.brandColor || '#2172E5',
    logo:        config?.logo || '',
  })
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployingStorage, setDeployingStorage] = useState(false)
  const [deployedStorageAddr, setDeployedStorageAddr] = useState<string | null>(null)

  const storageSupported = !!STORAGE_BY_CHAIN[chainId]

  const handleDeployStorage = async () => {
    if (!address || !publicClient) return
    setDeployingStorage(true)
    setError(null)
    try {
      const hash = await deployContractAsync({
        abi: STORAGE_ABI,
        bytecode: STORAGE_BYTECODE,
        args: [],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      if (receipt.contractAddress) {
        setDeployedStorageAddr(receipt.contractAddress)
      }
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Deploy failed')
    } finally {
      setDeployingStorage(false)
    }
  }

  const handleSave = async () => {
    if (!address) { setError('Connect wallet to save'); return }
    if (!storageSupported) {
      setError(`Chain ${chainId} not supported. Switch to BSC Mainnet (56) or BSC Testnet (97).`)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)
    setSaveStatus('')

    try {
      await saveAppData({
        domain:    domain || getCurrentDomain(),
        owner:     address,
        chainId,
        data: {
          projectName: branding.projectName,
          brandColor:  branding.brandColor,
          logo:        branding.logo,
          contracts: {
            [String(chainId)]: {
              factory:         contracts.factory || undefined,
              router:          contracts.router || undefined,
              quoter:          contracts.quoter || undefined,
              positionManager: contracts.positionManager || undefined,
            },
          },
        },
        writeContract: (args: object) => writeContractAsync(args as any),
        onStatus: (msg) => setSaveStatus(msg),
      })
      setSuccess(true)
      setSaveStatus('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || 'Save failed')
      setSaveStatus('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 max-w-lg w-full mx-auto shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Admin Panel</h2>
      <p className="text-xs text-gray-500 mb-6">
        Domain: <span className="text-gray-300 font-mono">{domain || getCurrentDomain()}</span>
        {config?.admin && (
          <span className="ml-3">
            Owner: <span className="text-gray-300 font-mono text-xs">{config.admin.slice(0, 6)}…{config.admin.slice(-4)}</span>
          </span>
        )}
      </p>

      {/* Contracts section */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Contracts — Chain {chainId}
        </h3>

        {!storageSupported && !deployedStorageAddr && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-xl text-xs text-yellow-700 dark:text-yellow-300">
            <p className="mb-2">Chain {chainId} has no Storage contract yet.</p>
            <p className="mb-3 text-yellow-600 dark:text-yellow-400">
              You can deploy one — we'll add it to the supported list after you send us the address.
            </p>
            <button
              type="button"
              onClick={handleDeployStorage}
              disabled={!isConnected || deployingStorage}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-xl transition-colors text-xs"
            >
              {deployingStorage ? 'Deploying Storage contract…' : 'Deploy Storage contract on this chain'}
            </button>
          </div>
        )}

        {deployedStorageAddr && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl text-xs">
            <p className="text-green-700 dark:text-green-400 font-medium mb-2">✓ Storage contract deployed!</p>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Address on chain {chainId}:</p>
            <code
              className="block bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-2 py-1.5 font-mono text-[11px] break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => navigator.clipboard.writeText(deployedStorageAddr)}
              title="Click to copy"
            >
              {deployedStorageAddr}
            </code>
            <p className="mt-2 text-yellow-600 dark:text-yellow-500">
              Send this address to the team — we'll add chain {chainId} to the supported list.
            </p>
          </div>
        )}

        {/* Preset chips */}
        <div className="mb-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Known deployments:</p>
          <div className="flex flex-wrap gap-2">
            {V3_PRESETS.map((p) => {
              const isCurrent = p.chainId === chainId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setContracts(p.contracts)}
                  className={`text-xs rounded-lg px-3 py-1.5 font-medium border transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {p.dex}
                  <span className={`ml-1.5 ${isCurrent ? 'text-blue-400 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {p.network}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setDeployOpen((o) => !o)}
              className="text-xs rounded-lg px-3 py-1.5 font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              Deploy your own ↗
            </button>
          </div>
        </div>

        {/* Deploy guide */}
        {deployOpen && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Deploy your own V3 contracts</span>
              <button type="button" onClick={() => setDeployOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>
            <pre className="text-[11px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">{DEPLOY_GUIDE}</pre>
          </div>
        )}

        <div className="space-y-3">
          {(
            [
              { key: 'factory',         label: 'Factory',          hint: 'UniswapV3Factory / PancakeV3Factory' },
              { key: 'router',          label: 'Router',           hint: 'SwapRouter02' },
              { key: 'quoter',          label: 'Quoter (V3)',      hint: 'QuoterV2 — enables V3 price quotes' },
              { key: 'positionManager', label: 'Position Manager', hint: 'NonfungiblePositionManager' },
            ] as const
          ).map(({ key, label, hint }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                {label}
                <span className="ml-2 text-gray-400 dark:text-gray-600">{hint}</span>
              </label>
              <input
                value={contracts[key]}
                onChange={(e) => setContracts((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder="0x..."
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 font-mono"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Branding section */}
      <section className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Branding</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Project Name</label>
            <input
              value={branding.projectName}
              onChange={(e) => setBranding((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="My DEX"
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.brandColor}
                onChange={(e) => setBranding((prev) => ({ ...prev, brandColor: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                value={branding.brandColor}
                onChange={(e) => setBranding((prev) => ({ ...prev, brandColor: e.target.value }))}
                placeholder="#2172E5"
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Logo URL</label>
            <input
              value={branding.logo}
              onChange={(e) => setBranding((prev) => ({ ...prev, logo: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl text-sm text-red-600 dark:text-red-300">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-xl text-sm text-green-700 dark:text-green-300">
          ✓ Config saved to BSC Storage!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!isConnected || saving || !storageSupported}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-colors"
      >
        {saving
          ? (saveStatus || 'Saving…')
          : !isConnected
          ? 'Connect Wallet to Save'
          : !storageSupported
          ? `Chain ${chainId} not supported`
          : 'Save Configuration'}
      </button>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        Saves to BSC {chainId === 97 ? 'Testnet' : 'Mainnet'} Storage. Only domain owner can update.
      </p>
    </div>
  )
}
