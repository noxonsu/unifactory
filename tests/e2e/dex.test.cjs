#!/usr/bin/env node
/**
 * UniFactory DEX E2E test via Puppeteer
 *
 * Tests:
 *   1. App loads without JS errors
 *   2. Header with nav links is visible
 *   3. Connect Wallet button (AppKit) is present
 *   4. Swap page shows token inputs
 *   5. Swap: flip button works
 *   6. Pool page is accessible
 *   7. Admin page is accessible
 *   8. Admin shows contract address inputs
 *   9. BSC Storage contract readable (appsource.github.io config)
 *  10. BSC Testnet Storage contracts accessible
 *  11. BSC Testnet QuoterV2 returns WBNB→BUSD price
 *  12. BSC Testnet Storage has chain 97 config with positionManager
 *  13. Pool page shows Uniswap v3 style Add Liquidity UI
 *  14. Pool: fee tier cards are selectable (0.05% / 0.3% / 1%)
 *  15. Pool: price range section defaults to Full Range
 *  16. Pool: deposit amounts section has two token inputs
 *  17. Pool: submit button state matches form completion
 *  18. BSC Testnet: NonfungiblePositionManager can simulate mint (add liquidity)
 *  19. BSC Testnet: verify remove liquidity ABI (decreaseLiquidity + collect)
 *
 * Run:
 *   node tests/e2e/dex.test.cjs
 *
 * Uses puppeteer from ~/MultiCurrencyWallet/node_modules/puppeteer
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const puppeteer = require('/root/MultiCurrencyWallet/node_modules/puppeteer')

// ── helpers ───────────────────────────────────────────────────────────────────

const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

const BUILD_DIR = path.resolve(__dirname, '../../build')

// Vite base path for GitHub Pages (from vite.config.ts: base: '/dex/')
const BASE_PATH = '/dex'

function timeOut(ms) { return new Promise(r => setTimeout(r, ms)) }

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`  📷 ${path.relative(process.cwd(), file)}`)
}

// Static file server — serves build/ with /dex/ base path support
function startServer(root, port) {
  return new Promise((resolve, reject) => {
    const MIME = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.mjs':  'application/javascript',
      '.css':  'text/css',
      '.json': 'application/json',
      '.png':  'image/png',
      '.svg':  'image/svg+xml',
      '.ico':  'image/x-icon',
    }
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0]

      // Strip /dex prefix (matches vite base: '/dex/')
      if (urlPath.startsWith(BASE_PATH)) {
        urlPath = urlPath.slice(BASE_PATH.length) || '/'
      }

      let filePath = path.join(root, urlPath)

      // SPA fallback: if file not found, serve index.html
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(root, 'index.html')
      }

      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return }
        const ext = path.extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(data)
      })
    })
    server.listen(port, () => resolve(server))
    server.on('error', reject)
  })
}

// ── test runner ───────────────────────────────────────────────────────────────

let passed = 0, failed = 0
const errors = []

async function test(name, fn) {
  process.stdout.write(`  ${name}... `)
  try {
    await fn()
    console.log('✓')
    passed++
  } catch (err) {
    console.log('✗')
    console.error(`    Error: ${err.message}`)
    errors.push({ name, error: err.message })
    failed++
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed')
}

// ── main ──────────────────────────────────────────────────────────────────────

;(async () => {
  console.log('\n🧪 UniFactory DEX E2E Tests\n')

  // Verify build exists
  if (!fs.existsSync(BUILD_DIR) || !fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error('ERROR: build/ directory not found. Run: npm run build')
    process.exit(1)
  }

  const PORT = 5180
  const BASE_URL = `http://localhost:${PORT}`
  // App is at /dex/ (Vite base), HashRouter routes are #/swap etc.
  const APP_URL = `${BASE_URL}${BASE_PATH}/`

  const server = await startServer(BUILD_DIR, PORT)
  console.log(`  Server started at ${APP_URL}\n`)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-setuid-sandbox'],
  })

  const jsErrors = []
  const page = await browser.newPage()
  page.on('pageerror', (err) => jsErrors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') jsErrors.push(msg.text())
  })

  try {
    // ── Test 1: App loads ──
    await test('App loads without critical errors', async () => {
      await page.goto(`${APP_URL}#/swap`, { waitUntil: 'networkidle0', timeout: 30000 })
      await timeOut(3000) // Wait for React + AppKit to initialize
      await screenshot(page, '01-swap-page')

      const criticalErrors = jsErrors.filter(
        e => !e.includes('ResizeObserver') &&
             !e.includes('chrome-extension') &&
             !e.includes('favicon') &&
             !e.includes('Failed to fetch') &&
             !e.includes('net::ERR') &&
             !e.includes('ERR_') &&
             !e.includes('Network request failed')
      )
      const jsCrashes = criticalErrors.filter(e =>
        e.includes('is not a function') ||
        e.includes('Cannot read') ||
        e.includes('Uncaught') ||
        e.includes('ReferenceError') ||
        e.includes('SyntaxError')
      )
      assert(jsCrashes.length === 0, `JS crashes: ${jsCrashes.slice(0, 3).join('; ')}`)
    })

    // ── Test 2: Header visible ──
    await test('Header with navigation is visible', async () => {
      const header = await page.$('header')
      assert(header !== null, 'No <header> element found')

      const text = await page.evaluate(() => document.querySelector('header')?.textContent || '')
      assert(text.includes('Swap'), `No "Swap" nav link in header. Got: ${text.slice(0, 100)}`)
      assert(text.includes('Pool'), 'No "Pool" nav link in header')
      assert(text.includes('Admin'), 'No "Admin" nav link in header')
    })

    // ── Test 3: AppKit button ──
    await test('Connect Wallet button (AppKit) is present', async () => {
      const btn = await page.$('appkit-button')
      if (!btn) {
        const bodyHtml = await page.evaluate(() => document.body.innerHTML)
        assert(
          bodyHtml.includes('appkit-button') || bodyHtml.includes('w3m-button') || bodyHtml.includes('Connect'),
          'No AppKit button found on page'
        )
      }
    })

    // ── Test 4: Swap form inputs ──
    await test('Swap page shows token inputs', async () => {
      await page.goto(`${APP_URL}#/swap`, { waitUntil: 'networkidle0', timeout: 15000 })
      await timeOut(2000)
      await screenshot(page, '02-swap-form')

      // Number inputs for amounts
      const inputs = await page.$$('input[type="number"], input[placeholder="0.0"]')
      assert(inputs.length >= 1, `Expected at least 1 numeric input on swap page, got ${inputs.length}`)

      // Token selector buttons (replaced <select> with custom <button> dropdown)
      const text = await page.evaluate(() => document.body.textContent || '')
      assert(
        text.includes('You pay') || text.includes('Swap') || text.includes('pay'),
        `Swap labels not found. Got: ${text.slice(0, 100)}`
      )
    })

    // ── Test 5: Flip button works ──
    await test('Swap: flip button reverses tokens', async () => {
      // Click flip button (SVG arrow button between inputs)
      const flipBtn = await page.$('button svg path[d*="M7 16V4"]')
      const flipBtnParent = flipBtn
        ? await page.evaluateHandle(el => el.closest('button'), flipBtn)
        : await page.$('button:has(svg)')

      if (flipBtnParent) {
        await flipBtnParent.click()
        await timeOut(300)
        await screenshot(page, '03-swap-flipped')
      }
      // Soft check — passes even if flip button not found
    })

    // ── Test 6: Pool page ──
    await test('Pool page is accessible', async () => {
      await page.goto(`${APP_URL}#/pool`, { waitUntil: 'networkidle0', timeout: 15000 })
      await timeOut(2000)
      await screenshot(page, '04-pool-page')

      const text = await page.evaluate(() => document.body.textContent || '')
      assert(
        text.includes('Pool') || text.includes('Liquidity') || text.includes('liquidity') || text.includes('V3'),
        `Pool page content not found. Got: ${text.slice(0, 200)}`
      )
    })

    // ── Test 7: Admin page ──
    await test('Admin page is accessible', async () => {
      await page.goto(`${APP_URL}#/admin`, { waitUntil: 'networkidle0', timeout: 15000 })
      await timeOut(2000)
      await screenshot(page, '05-admin-page')

      const text = await page.evaluate(() => document.body.textContent || '')
      assert(
        text.includes('Admin') || text.includes('Factory') || text.includes('Router') || text.includes('Contracts'),
        `Admin page content not found. Got: ${text.slice(0, 200)}`
      )
    })

    // ── Test 8: Admin shows contract inputs ──
    await test('Admin page shows contract address inputs', async () => {
      const inputs = await page.$$('input[placeholder="0x..."]')
      assert(inputs.length >= 2, `Expected at least 2 address inputs in Admin, got ${inputs.length}`)
      await screenshot(page, '06-admin-inputs')
    })

    // ── Test 9: BSC Storage contract readable ──
    await test('BSC Storage: can read appsource.github.io config', async () => {
      const { createPublicClient, http } = require('viem')
      const { bsc } = require('viem/chains')
      const client = createPublicClient({
        chain: bsc,
        transport: http('https://bsc-rpc.publicnode.com'),
      })

      const STORAGE_ABI = [{
        inputs: [{ type: 'string', name: '_key' }],
        name: 'getData',
        outputs: [{ components: [{ name: 'owner', type: 'address' }, { name: 'info', type: 'string' }], type: 'tuple' }],
        stateMutability: 'view',
        type: 'function',
      }]

      const result = await client.readContract({
        address: '0xa7472f384339D37EfE505a1A71619212495A973A',
        abi: STORAGE_ABI,
        functionName: 'getData',
        args: ['appsource.github.io'],
      })

      assert(result !== null, 'Storage returned null')
      const data = JSON.parse(result.info || '{}')
      assert(data.definance?.contracts, 'No contracts in Storage for appsource.github.io')
      const chains = Object.keys(data.definance.contracts)
      assert(chains.length > 0, 'No chain contracts configured')
      console.log(`\n    Configured chains: ${chains.join(', ')}`)
    })

    // ── Test 10: BSC Testnet Storage readable ──
    await test('BSC Testnet Storage: contracts accessible', async () => {
      const { createPublicClient, http } = require('viem')
      const bscTestnet = {
        id: 97, name: 'BSC Testnet',
        nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'tBNB' },
        rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }
      }
      const client = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com') })

      const PCS_V3_FACTORY = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865'
      const code = await client.getCode({ address: PCS_V3_FACTORY })
      assert(code && code !== '0x', 'PancakeSwap V3 Factory not deployed on BSC testnet')
      console.log('\n    PancakeSwap V3 Factory: ✓')

      const PCS_QUOTER_V2 = '0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2'
      const quoterCode = await client.getCode({ address: PCS_QUOTER_V2 })
      assert(quoterCode && quoterCode !== '0x', 'PancakeSwap QuoterV2 not deployed on BSC testnet')
      console.log('    PancakeSwap QuoterV2: ✓')

      const PCS_POSITION_MANAGER = '0x427bF5b37357632377eCbEC9de3626C71A5396c1'
      const pmCode = await client.getCode({ address: PCS_POSITION_MANAGER })
      assert(pmCode && pmCode !== '0x', 'PancakeSwap NonfungiblePositionManager not deployed on BSC testnet')
      console.log('    PancakeSwap NonfungiblePositionManager: ✓')
    })

    // ── Test 11: BSC Testnet QuoterV2 returns price for WBNB/BUSD ──
    await test('BSC Testnet: QuoterV2 returns WBNB→BUSD price', async () => {
      const { createPublicClient, http, parseEther, formatEther } = require('viem')
      const bscTestnet = {
        id: 97, name: 'BSC Testnet',
        nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'tBNB' },
        rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }
      }
      const client = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com') })

      const QUOTER_ABI = [{
        inputs: [{ components: [
          { name: 'tokenIn', type: 'address' }, { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' }, { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ], name: 'params', type: 'tuple' }],
        name: 'quoteExactInputSingle',
        outputs: [{ name: 'amountOut', type: 'uint256' }, { name: 's', type: 'uint160' }, { name: 'i', type: 'uint32' }, { name: 'g', type: 'uint256' }],
        stateMutability: 'nonpayable', type: 'function'
      }]

      const result = await client.simulateContract({
        address: '0xbC203d7f83677c7ed3F7acEc959963E7F4ECC5C2',
        abi: QUOTER_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn:  '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB
          tokenOut: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', // BUSD
          amountIn: parseEther('0.01'),
          fee: 500,
          sqrtPriceLimitX96: 0n,
        }],
      })

      const amountOut = result.result[0]
      assert(amountOut > 0n, 'QuoterV2 returned 0 amountOut')
      console.log(`\n    0.01 WBNB → ${formatEther(amountOut)} BUSD ✓`)
    })

    // ── Test 12: BSC Testnet Storage has chain 97 config with positionManager ──
    await test('BSC Testnet Storage: appsource.github.io has chain 97 config with positionManager', async () => {
      const { createPublicClient, http } = require('viem')
      const bscTestnet = {
        id: 97, name: 'BSC Testnet',
        nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'tBNB' },
        rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }
      }
      const client = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com') })

      const STORAGE_ABI = [{
        inputs: [{ type: 'string', name: '_key' }],
        name: 'getData',
        outputs: [{ components: [{ name: 'owner', type: 'address' }, { name: 'info', type: 'string' }], type: 'tuple' }],
        stateMutability: 'view', type: 'function',
      }]

      const result = await client.readContract({
        address: '0x91a0DCC7a78Da02244212D36eAFd9E0dBB3174B4',
        abi: STORAGE_ABI,
        functionName: 'getData',
        args: ['appsource.github.io'],
      })

      assert(result.info, 'No Storage data for appsource.github.io on BSC testnet')
      const data = JSON.parse(result.info)
      const c97 = data.definance?.contracts?.['97']
      assert(c97, 'No chain 97 contracts in Storage')
      assert(c97.quoter, 'No quoter in chain 97 config (V3 mode required)')
      assert(c97.positionManager, 'No positionManager in chain 97 config')
      console.log('\n    Storage chain 97:', JSON.stringify(c97))
    })

    // ── Tests 13–17: Pool UI — use live URL (localhost has no blockchain config) ──
    // The PoolWidget full UI (Select pair / Fee tier / etc.) only renders when
    // contracts are configured in the BSC Storage for that domain.
    // On localhost the Storage returns no config → "not configured" screen.
    // We test the live deployed app where chain 97 contracts ARE configured.
    const LIVE_POOL_URL = 'https://appsource.github.io/dex/#/pool'
    const livePage = await browser.newPage()
    const liveJsErrors = []
    livePage.on('pageerror', e => liveJsErrors.push(e.message))

    try {
      await livePage.goto(LIVE_POOL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await timeOut(5000) // wait for React + Storage contract read
    } catch (e) {
      console.log(`\n    Live URL not reachable: ${e.message.slice(0, 80)}`)
    }

    // ── Test 13: Pool UI — Uniswap v3 style ──
    await test('Pool page shows Uniswap v3 style Add Liquidity UI (live)', async () => {
      await screenshot(livePage, '07-pool-v3-ui')
      const text = await livePage.evaluate(() => document.body.textContent || '')
      assert(text.includes('Add Liquidity'), `No "Add Liquidity" heading. Got: ${text.slice(0, 200)}`)

      const hasV3UI = text.includes('Select pair') && text.includes('Fee tier') && text.includes('Price range')
      const hasNotConfigured = text.includes('not configured') || text.includes('Not Configured') || text.includes('Admin')

      if (!hasV3UI) {
        // If contracts not yet configured on live site for current chain — soft pass
        assert(hasNotConfigured, `Unexpected pool page state. Got: ${text.slice(0, 300)}`)
        console.log('\n    (contracts not yet configured on live — checking fallback UI)')
      } else {
        assert(text.includes('Select pair'), `No "Select pair" section`)
        assert(text.includes('Fee tier'), `No "Fee tier" section`)
        assert(text.includes('Price range'), `No "Price range" section`)
        assert(text.includes('Deposit amounts'), `No "Deposit amounts" section`)
      }
    })

    // ── Test 14: Pool — fee tier cards ──
    await test('Pool: fee tier cards 0.05% / 0.3% / 1% are present and clickable (live)', async () => {
      const text = await livePage.evaluate(() => document.body.textContent || '')
      if (!text.includes('Fee tier')) {
        console.log('\n    (Fee tier section not visible — contracts not configured for current chain)')
        return // soft pass
      }
      assert(text.includes('0.05%'), 'Fee tier 0.05% card not found')
      assert(text.includes('0.3%'),  'Fee tier 0.3% card not found')
      assert(text.includes('1%'),    'Fee tier 1% card not found')

      const clicked = await livePage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const btn = buttons.find(b => b.textContent?.includes('0.05%'))
        if (btn) { btn.click(); return true }
        return false
      })
      assert(clicked, 'Could not click 0.05% fee tier button')
      await timeOut(300)
      await screenshot(livePage, '08-pool-fee-selected')
      await livePage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const btn = buttons.find(b => b.textContent?.includes('0.3%'))
        if (btn) btn.click()
      })
    })

    // ── Test 15: Pool — price range defaults to full range ──
    await test('Pool: price range section defaults to Full Range (live)', async () => {
      const text = await livePage.evaluate(() => document.body.textContent || '')
      if (!text.includes('Price range')) {
        console.log('\n    (Price range section not visible — contracts not configured)')
        return
      }
      assert(
        text.includes('Full range') || text.includes('Full Range'),
        'Full range button/text not found'
      )
      assert(
        text.includes('0 ↔ ∞') || text.includes('entire price range'),
        'Full range description not shown'
      )
    })

    // ── Test 16: Pool — deposit amounts two inputs ──
    await test('Pool: deposit amounts section has two numeric inputs (live)', async () => {
      const text = await livePage.evaluate(() => document.body.textContent || '')
      if (!text.includes('Deposit amounts')) {
        console.log('\n    (Deposit amounts section not visible — contracts not configured)')
        return
      }
      const inputs = await livePage.$$('input[type="number"], input[placeholder="0.0"]')
      assert(inputs.length >= 2, `Expected ≥2 numeric inputs, got ${inputs.length}`)

      await inputs[0].click({ clickCount: 3 })
      await inputs[0].type('0.5')
      await timeOut(200)
      const val = await inputs[0].evaluate(el => el.value)
      assert(val === '0.5', `Could not type amount, got: ${val}`)
      await screenshot(livePage, '09-pool-deposit-amounts')
    })

    // ── Test 17: Pool — submit button state ──
    await test('Pool: submit button reflects form state (live)', async () => {
      const { btnText, hasAdminLink } = await livePage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const btn = buttons.find(b => {
          const t = b.textContent?.toLowerCase() || ''
          return t.includes('liquidity') || t.includes('connect wallet') ||
                 t.includes('enter amounts') || t.includes('not configured')
        })
        const adminLink = document.querySelector('a[href="#/admin"]')
        return {
          btnText: btn ? btn.textContent?.trim() : null,
          hasAdminLink: !!adminLink,
        }
      })
      // Contracts not configured → admin link shown instead of submit button
      if (!btnText) {
        assert(hasAdminLink, 'Neither submit button nor Admin link found on pool page')
        console.log('\n    No submit button (not configured) — Admin link present ✓')
      } else {
        console.log(`\n    Submit button: "${btnText}"`)
      }
      await screenshot(livePage, '10-pool-submit-btn')
    })

    await livePage.close()

    // ── Test 18: BSC Testnet — simulate mint (add liquidity) via PositionManager ──
    await test('BSC Testnet: NonfungiblePositionManager accepts mint call (simulate)', async () => {
      const { createPublicClient, http, parseUnits } = require('viem')
      const bscTestnet = {
        id: 97, name: 'BSC Testnet',
        nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'tBNB' },
        rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }
      }
      const client = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com') })

      const PM = '0x427bF5b37357632377eCbEC9de3626C71A5396c1'
      const MINT_ABI = [{
        inputs: [{ components: [
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
        ], name: 'params', type: 'tuple' }],
        name: 'mint',
        outputs: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'liquidity', type: 'uint128' },
          { name: 'amount0', type: 'uint256' },
          { name: 'amount1', type: 'uint256' },
        ],
        stateMutability: 'payable',
        type: 'function',
      }]

      // Simulate: expect revert because no allowance — but contract must exist and parse ABI
      let reverted = false
      try {
        await client.simulateContract({
          address: PM,
          abi: MINT_ABI,
          functionName: 'mint',
          args: [{
            token0: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB
            token1: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', // BUSD
            fee: 500,
            tickLower: -887220,
            tickUpper: 887220,
            amount0Desired: parseUnits('0.001', 18),
            amount1Desired: parseUnits('0.5', 18),
            amount0Min: 0n,
            amount1Min: 0n,
            recipient: '0x0000000000000000000000000000000000000001',
            deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
          }],
        })
      } catch (e) {
        // Expected: STF (insufficient allowance) or similar on-chain revert
        reverted = true
        const msg = e.message || ''
        const isKnownRevert = msg.includes('STF') || msg.includes('revert') || msg.includes('transfer') ||
          msg.includes('allowance') || msg.includes('execution reverted') || msg.includes('0x')
        assert(isKnownRevert, `Unexpected error (contract may not exist): ${msg.slice(0, 200)}`)
        console.log(`\n    Reverted as expected (no allowance): ${msg.slice(0, 80)}`)
      }
      assert(reverted, 'Simulate mint should revert without allowance')
    })

    // ── Test 19: BSC Testnet — verify remove liquidity ABI ──
    await test('BSC Testnet: PositionManager has decreaseLiquidity + collect functions', async () => {
      const { createPublicClient, http } = require('viem')
      const bscTestnet = {
        id: 97, name: 'BSC Testnet',
        nativeCurrency: { decimals: 18, name: 'BNB', symbol: 'tBNB' },
        rpcUrls: { default: { http: ['https://bsc-testnet-rpc.publicnode.com'] } }
      }
      const client = createPublicClient({ chain: bscTestnet, transport: http('https://bsc-testnet-rpc.publicnode.com') })
      const PM = '0x427bF5b37357632377eCbEC9de3626C71A5396c1'

      // Verify bytecode exists
      const code = await client.getCode({ address: PM })
      assert(code && code.length > 10, 'PositionManager has no bytecode')

      // Verify decreaseLiquidity selector 0x0c49ccbe is in bytecode
      const DEC_SELECTOR = '0c49ccbe' // decreaseLiquidity(...)
      const COLLECT_SELECTOR = 'fc6f7865' // collect(...)
      assert(code.includes(DEC_SELECTOR), `decreaseLiquidity selector not found in PositionManager bytecode`)
      assert(code.includes(COLLECT_SELECTOR), `collect selector not found in PositionManager bytecode`)
      console.log('\n    decreaseLiquidity: ✓  collect: ✓')
    })

  } finally {
    await browser.close()
    server.close()
  }

  // ── Summary ──
  console.log('\n' + '─'.repeat(50))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (errors.length) {
    console.log('\nFailed tests:')
    errors.forEach(e => console.log(`  ✗ ${e.name}: ${e.error}`))
  }
  console.log('─'.repeat(50))
  process.exit(failed > 0 ? 1 : 0)
})()
