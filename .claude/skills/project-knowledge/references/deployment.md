# UniFactory DEX — Deployment

## CI/CD

**Trigger:** push to `main` branch of `noxonsu/unifactory`
**Workflow:** `.github/workflows/deploy.yml`
**Target:** `appsource/dex` repo, `gh-pages` branch
**Live URL:** https://appsource.github.io/dex

The workflow:
1. `npm install --legacy-peer-deps` (Node 20)
2. `npm run build_clean` → `build/`
3. Force-push `build/` to `appsource/dex:gh-pages`

**Note:** `appsource/dex` main branch is protected — can only deploy to gh-pages, not main.

## Env Vars

| Variable | Where Used | Value |
|----------|-----------|-------|
| `VITE_DEV_DOMAIN` | `.env.local` for dev | e.g. `appsource.github.io` |
| `VITE_STORAGE_ADDRESS` | `.env.production` | `0xa7472f384339D37EfE505a1A71619212495A973A` |
| `VITE_TESTNET_STORAGE_ADDRESS` | `.env.development` | `0x91a0DCC7a78Da02244212D36eAFd9E0dBB3174B4` |
| `DEPLOYER_PRIVATE_KEY` | `/root/PolyFactory/.env` | Deployer account for on-chain registration |
| `APPSOURCE_TOKEN` | GitHub Actions secret | PAT for pushing to appsource/dex |

## Local Development

```bash
cd /root/unifactory
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173
```

Vite serves with `base: '/dex/'` in production only. In dev mode, served at root `/`.

## Registering a New Domain

1. Get WBNB/BNB for gas on BSC mainnet (Storage contract lives on BSC mainnet)
2. Run: `PRIVATE_KEY=0x... DOMAIN=example.com node scripts/register-mainnet.cjs`
3. Optionally register testnet: `PRIVATE_KEY=0x... DOMAIN=example.com node scripts/register-testnet.cjs`
4. User opens their domain, admin panel reads Storage config automatically

## BSC Testnet Tokens (for testing)

- WBNB faucet: wrap from tBNB (call WBNB.deposit() with ETH value)
- tBNB faucet: https://testnet.bnbchain.org/faucet-smart
- BUSD testnet: `0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee` (liquidity in WBNB/BUSD pool)
- Pool explorer: https://testnet.bscscan.com/address/0xa0172eaa8aC038FaDC47129F8dFE9d20c3073Ea9

## Monitoring

No dedicated monitoring. Check:
- GitHub Actions for deploy status: `gh run list -R noxonsu/unifactory --limit 5`
- Live demo: https://appsource.github.io/dex
- BSCScan for on-chain config: read `getData('appsource.github.io')` on Storage contract
