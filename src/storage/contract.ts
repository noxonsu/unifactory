import { createPublicClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { STORAGE_ABI } from './abi'
import { StorageConfig } from './types'

const STORAGE_APP_KEY = 'definance'

// Storage contract addresses per chain
export const STORAGE_BY_CHAIN: Record<number, { address: string; rpc: string }> = {
  56: {
    address: '0xa7472f384339D37EfE505a1A71619212495A973A',
    rpc: 'https://bsc-rpc.publicnode.com',
  },
  97: {
    address: '0x91a0DCC7a78Da02244212D36eAFd9E0dBB3174B4',
    rpc: 'https://bsc-testnet-rpc.publicnode.com',
  },
}

// Default: BSC mainnet (for domain config reads on production)
const DEFAULT_CHAIN_ID = 56

const bscClient = createPublicClient({
  chain: bsc,
  transport: http('https://bsc-rpc.publicnode.com'),
})

function getClientForChain(chainId: number) {
  const cfg = STORAGE_BY_CHAIN[chainId]
  if (!cfg) return { client: bscClient, address: STORAGE_BY_CHAIN[DEFAULT_CHAIN_ID].address }
  const chain = chainId === 56 ? bsc : {
    id: chainId, name: `Chain ${chainId}`,
    nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'BNB' },
    rpcUrls: { default: { http: [cfg.rpc] } },
  }
  return {
    client: createPublicClient({ chain: chain as any, transport: http(cfg.rpc) }),
    address: cfg.address,
  }
}

export const getCurrentDomain = (): string => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_DOMAIN) {
    return import.meta.env.VITE_DEV_DOMAIN
  }
  return window.location.hostname || document.location.host || ''
}

export const fetchDomainData = async (domain: string): Promise<StorageConfig | null> => {
  try {
    const { address: storageAddress } = getClientForChain(DEFAULT_CHAIN_ID)
    const result = await bscClient.readContract({
      address: storageAddress as `0x${string}`,
      abi: STORAGE_ABI,
      functionName: 'getData',
      args: [domain.toLowerCase()],
    })

    const { owner, info } = result as { owner: string; info: string }

    if (!info || info === '{}' || info === '') {
      return null
    }

    const parsed = JSON.parse(info)
    const appData = parsed[STORAGE_APP_KEY]

    if (!appData) {
      return null
    }

    return {
      admin: owner,
      domain,
      projectName: appData.projectName || '',
      brandColor: appData.brandColor || '',
      backgroundColorDark: appData.backgroundColorDark || '',
      backgroundColorLight: appData.backgroundColorLight || '',
      textColorDark: appData.textColorDark || '',
      textColorLight: appData.textColorLight || '',
      logo: appData.logo || '',
      favicon: appData.favicon || '',
      contracts: appData.contracts || {},
      tokenLists: appData.tokenLists || {},
      addressesOfTokenLists: appData.addressesOfTokenLists || [],
      navigationLinks: appData.navigationLinks || [],
      defaultSwapCurrency: appData.defaultSwapCurrency || { input: '', output: '' },
      disableSourceCopyright: appData.disableSourceCopyright || false,
    }
  } catch (err) {
    console.error('[Storage] fetchDomainData error:', err)
    return null
  }
}

// Save config to BSC Storage (requires wallet signer)
export const saveAppData = async (params: {
  domain: string
  owner: string
  chainId: number
  data: Partial<StorageConfig>
  writeContract: (args: object) => Promise<string>
  onStatus?: (msg: string) => void
}): Promise<string> => {
  const { domain, owner, chainId, data, writeContract, onStatus } = params

  const { client, address: storageAddress } = getClientForChain(chainId)
  if (!STORAGE_BY_CHAIN[chainId]) {
    throw new Error(`No Storage contract configured for chain ${chainId}. Supported: ${Object.keys(STORAGE_BY_CHAIN).join(', ')}`)
  }

  onStatus?.('Reading existing config…')

  // Read existing data from the correct chain's Storage
  let existingRaw: Record<string, unknown> = {}
  try {
    const result = await Promise.race([
      client.readContract({
        address: storageAddress as `0x${string}`,
        abi: STORAGE_ABI,
        functionName: 'getData',
        args: [domain.toLowerCase()],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Storage read timeout (10s)')), 10_000)),
    ])
    const { info } = result as { info: string }
    if (info) existingRaw = JSON.parse(info)
  } catch (e: any) {
    if (e.message?.includes('timeout')) throw e
    // no existing data — start fresh
  }

  const existing = (existingRaw[STORAGE_APP_KEY] as Record<string, unknown>) || {}

  const merged = {
    ...existingRaw,
    [STORAGE_APP_KEY]: {
      ...existing,
      ...data,
      contracts: {
        ...(existing.contracts as Record<string, unknown> || {}),
        ...(data.contracts || {}),
      },
    },
  }

  onStatus?.('Waiting for wallet signature…')

  const hash = await writeContract({
    address: storageAddress,
    abi: STORAGE_ABI,
    functionName: 'setKeyData',
    args: [
      domain.toLowerCase(),
      { owner, info: JSON.stringify(merged) },
    ],
  })

  return hash
}
