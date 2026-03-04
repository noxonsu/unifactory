# UniFactory DEX — Architecture

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + Vite | Fast builds, ESM-native, replaces old webpack/React 17 fork |
| Wallet | Reown AppKit + wagmi v2 + viem | Replaces deprecated web3-react v6; AppKit provides multi-wallet modal |
| DEX logic | @uniswap/v3-sdk + @uniswap/sdk-core | Standard V3 math for ticks and liquidity |
| State | TanStack Query | Storage config cached with automatic refetch |
| Styling | Tailwind CSS (`darkMode: 'class'`) | Utility-first, light/dark via `dark` class on `<html>` |
| Build | Vite, `base: '/dex/'` | Deployed to GitHub Pages subpath `/dex/` |

## Project Structure

```
src/
├── appkit.ts              # AppKit modal + wagmi config; reads ?theme param
├── storage/
│   ├── abi.ts             # BSC Storage ABI (viem-compatible)
│   ├── contract.ts        # fetchDomainData(), saveAppData()
│   └── types.ts           # StorageConfig type; isV3Mode() check
├── hooks/
│   ├── useStorageConfig.ts # TanStack Query: loads Storage on startup
│   └── useSwap.ts          # getQuote() via QuoterV2, executeSwap() via SwapRouter02
├── components/
│   ├── Header/             # Navigation + AppKit connect button
│   ├── Swap/               # SwapWidget + TokenInput (custom dropdown with token icons)
│   ├── Pool/               # PoolWidget: add V3 liquidity via NonfungiblePositionManager
│   └── Admin/              # AdminPanel: save contracts/branding on-chain
└── pages/                  # SwapPage, PoolPage, AdminPage (HashRouter: #/swap, #/pool, #/admin)
```

## BSC Storage Contract

All DEX configuration lives in a single BSC mainnet Storage contract. Key: domain name. Value: JSON blob with all config.

- **Mainnet Storage:** `0xa7472f384339D37EfE505a1A71619212495A973A` (BSC mainnet)
- **Testnet Storage:** `0x91a0DCC7a78Da02244212D36eAFd9E0dBB3174B4` (BSC testnet)
- **App namespace key:** `definance` (hardcoded)

Storage schema documented in `SKILL.md` and `src/storage/types.ts`.

## V3 Mode Detection

`isV3Mode(contracts)` in `src/storage/types.ts` — returns true if `contracts.quoter` is set.

| Has `quoter` | Mode | Swap quotes | Add liquidity |
|---|---|---|---|
| No | V2 | Not available | Not available |
| Yes, no `positionManager` | V3 partial | ✓ | UI shows warning |
| Yes + `positionManager` | V3 full | ✓ | ✓ |

## Configured Chains (as of 2026-03-05)

All configured in BSC mainnet Storage for domain `appsource.github.io`:

| Chain | Protocol | positionManager |
|-------|----------|-----------------|
| 1 (Ethereum) | Uniswap V3 | `0xC36442b4a4522E871399CD717aBDD847Ab11FE88` |
| 56 (BSC) | PancakeSwap V3 | `0x46A15B0b27311cedF172AB29E4f4766fbE7F4364` |
| 97 (BSC testnet) | PancakeSwap V3 | `0x427bF5b37357632377eCbEC9de3626C71A5396c1` |

PancakeSwap V3 is a fork of Uniswap V3 with identical ABI — same SDK and ABIs work for both.

## Theme System

`src/appkit.ts` reads `?theme` before React mounts. Sets `document.documentElement.classList` (`dark` or removes it) and passes `themeMode` to AppKit. All components use Tailwind `dark:` prefix variants — no hardcoded dark colors.

## Routing

HashRouter: `#/swap`, `#/pool`, `#/admin`. Required because the app is hosted on GitHub Pages at `/dex/` subpath — hash routing avoids server-side 404 on refresh.

## Deployer Account

`0x0b5Ce0876F4Ddae8612d4a3E3587f27dd46820C6` — private key at `/root/PolyFactory/.env` (`DEPLOYER_PRIVATE_KEY`)
