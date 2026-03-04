# UniFactory DEX — Project Patterns

## Storage Registration Scripts

Scripts in `scripts/` register domain config on-chain. They are CJS files that import viem directly:

- `scripts/register-testnet.cjs` — registers BSC testnet (chain 97) contracts for a domain
- `scripts/register-mainnet.cjs` — registers BSC mainnet (chain 56) contracts

Run: `PRIVATE_KEY=0x... DOMAIN=example.com node scripts/register-testnet.cjs`

**Critical import path for CJS scripts:**
Use `require('/root/unifactory/node_modules/viem/_cjs/index.js')` — not `require('viem')` (ESM-only in this package).

## Token Input — Custom Dropdown

`src/components/Swap/TokenInput.tsx` uses a custom `<button>`-based dropdown instead of `<select>/<option>` to show token logos. Uses `useRef` + `document.addEventListener('mousedown', ...)` for click-outside detection. Pattern: `failed` state in `TokenIcon` component handles broken image URLs gracefully.

## Pool Widget — Three-State Logic

`PoolWidget.tsx` has three distinct states before showing the form:
1. No router → "DEX not configured"
2. V2 mode (no quoter) → "V3 contracts required"
3. V3 but no positionManager → show form with warning (PM addresses as hints), button disabled

This pattern avoids misleading partial states where the form appears but can't function.

## E2E Tests

File: `tests/e2e/dex.test.cjs` — must be `.cjs` because `package.json` has `"type": "module"`.

Test server strips `/dex/` prefix from requests (Vite `base: '/dex/'` in production but tests serve `build/` as root). Navigate to `${BASE_URL}/dex/#/route` format.

Puppeteer sourced from `/root/MultiCurrencyWallet/node_modules/puppeteer` — no separate install needed.

Run: `node tests/e2e/dex.test.cjs`

## BSC Storage — Data Shape

The Storage stores a JSON string. Top-level key is the domain, value contains `definance` namespace:

```
Storage.getData(domain) → { owner: address, info: JSON.stringify({definance: {...}}) }
```

When saving, always merge with existing data to avoid overwriting other app keys. See `saveAppData()` in `src/storage/contract.ts`.

## Build Dependency Issue

`npm install --legacy-peer-deps` required — `@uniswap/v3-sdk` and related packages declare peer deps on older React versions. `--legacy-peer-deps` skips the strict peer dep check without affecting functionality.

## Pre-commit Hook

`.husky/pre-commit` checks that SKILL.md exists, then runs `node scripts/check-rpc.js` (critical RPC health). Fails commit if BSC/mainnet/polygon RPCs are down. Non-critical RPCs (Fantom) just warn.
