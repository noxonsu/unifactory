#!/usr/bin/env node
/**
 * Register domain with PancakeSwap V3 contracts on BSC Mainnet (chain 56)
 * including NonfungiblePositionManager for liquidity pools.
 *
 * Usage:
 *   PRIVATE_KEY=0x... node scripts/register-mainnet.cjs
 *
 * Or with domain override:
 *   PRIVATE_KEY=0x... DOMAIN=mydex.example.com node scripts/register-mainnet.cjs
 *
 * PancakeSwap V3 BSC Mainnet contracts:
 *   https://github.com/pancakeswap/pancake-v3-contracts/blob/main/projects/v3-core/deployments/bsc/factory.json
 */

const { createPublicClient, createWalletClient, http } = require('viem')
const { privateKeyToAccount } = require('/root/unifactory/node_modules/viem/_cjs/accounts/index.js')

const PRIVATE_KEY = process.env.PRIVATE_KEY
if (!PRIVATE_KEY) {
  console.error('ERROR: PRIVATE_KEY env var required')
  process.exit(1)
}

const DOMAIN = process.env.DOMAIN || 'appsource.github.io'

const bscMainnet = {
  id: 56,
  name: 'BSC Mainnet',
  nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'BNB' },
  rpcUrls: { default: { http: ['https://bsc-rpc.publicnode.com'] } },
  blockExplorers: { default: { name: 'BSCScan', url: 'https://bscscan.com' } },
}

// PancakeSwap V3 on BSC Mainnet (chain 56)
// Source: https://github.com/pancakeswap/pancake-v3-contracts
const PCS_V3_MAINNET = {
  factory:         '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
  router:          '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  quoter:          '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
  positionManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364',
}

// Popular BSC mainnet tokens with logos
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const USDT = '0x55d398326f99059fF775485246999027B3197955'
const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
const USDC = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'

const TOKEN_LIST_56 = {
  default: {
    name: 'BSC Mainnet Default',
    tokens: [
      {
        address: WBNB,
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        decimals: 18,
        chainId: 56,
        logoURI: 'https://tokens.pancakeswap.finance/images/symbol/bnb.png',
      },
      {
        address: USDT,
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 18,
        chainId: 56,
        logoURI: 'https://tokens.pancakeswap.finance/images/symbol/usdt.png',
      },
      {
        address: BUSD,
        symbol: 'BUSD',
        name: 'Binance USD',
        decimals: 18,
        chainId: 56,
        logoURI: 'https://tokens.pancakeswap.finance/images/symbol/busd.png',
      },
      {
        address: USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 18,
        chainId: 56,
        logoURI: 'https://tokens.pancakeswap.finance/images/symbol/usdc.png',
      },
    ],
  },
}

const STORAGE_ADDRESS = '0xa7472f384339D37EfE505a1A71619212495A973A' // BSC Mainnet Storage
const STORAGE_APP_KEY = 'definance'

const STORAGE_ABI = [
  {
    inputs: [{ type: 'string', name: '_key' }],
    name: 'getData',
    outputs: [{ components: [{ name: 'owner', type: 'address' }, { name: 'info', type: 'string' }], type: 'tuple' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { type: 'string', name: '_key' },
      { components: [{ name: 'owner', type: 'address' }, { name: 'info', type: 'string' }], type: 'tuple', name: '_data' },
    ],
    name: 'setKeyData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

;(async () => {
  const account = privateKeyToAccount(PRIVATE_KEY)
  console.log(`\nAccount: ${account.address}`)
  console.log(`Domain:  ${DOMAIN}`)
  console.log(`Network: BSC Mainnet (56)`)
  console.log(`Storage: ${STORAGE_ADDRESS}\n`)

  const publicClient = createPublicClient({ chain: bscMainnet, transport: http('https://bsc-rpc.publicnode.com') })
  const walletClient = createWalletClient({ account, chain: bscMainnet, transport: http('https://bsc-rpc.publicnode.com') })

  const balance = await publicClient.getBalance({ address: account.address })
  console.log(`Balance: ${Number(balance) / 1e18} BNB`)
  if (balance === 0n) {
    console.error('ERROR: No BNB for gas.')
    process.exit(1)
  }

  const existing = await publicClient.readContract({
    address: STORAGE_ADDRESS,
    abi: STORAGE_ABI,
    functionName: 'getData',
    args: [DOMAIN],
  })

  let existingData = {}
  if (existing.info) {
    try { existingData = JSON.parse(existing.info) } catch (_) {}
  }

  const existingApp = existingData[STORAGE_APP_KEY] || {}

  const newData = {
    ...existingData,
    [STORAGE_APP_KEY]: {
      ...existingApp,
      contracts: {
        ...(existingApp.contracts || {}),
        '56': PCS_V3_MAINNET,
      },
      tokenLists: {
        ...(existingApp.tokenLists || {}),
        '56': TOKEN_LIST_56,
      },
      defaultSwapCurrency: existingApp.defaultSwapCurrency || {
        input: WBNB,
        output: USDT,
      },
      projectName: existingApp.projectName || 'UniFactory DEX',
    },
  }

  console.log('Writing PancakeSwap V3 BSC Mainnet contracts:')
  console.log(JSON.stringify(PCS_V3_MAINNET, null, 2))

  const hash = await walletClient.writeContract({
    address: STORAGE_ADDRESS,
    abi: STORAGE_ABI,
    functionName: 'setKeyData',
    args: [DOMAIN, { owner: account.address, info: JSON.stringify(newData) }],
  })

  console.log(`\nTX hash: ${hash}`)
  console.log(`Explorer: https://bscscan.com/tx/${hash}`)

  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  console.log(`Status: ${receipt.status === 'success' ? '✓ SUCCESS' : '✗ FAILED'}`)

  if (receipt.status === 'success') {
    console.log(`\n✓ Domain '${DOMAIN}' registered on BSC Mainnet Storage!`)
    console.log(`  Switch wallet to BSC Mainnet (chain 56).`)
    console.log(`  Pool page will now show NonfungiblePositionManager for adding liquidity.`)
  }
})().catch(e => { console.error(e.message); process.exit(1) })
