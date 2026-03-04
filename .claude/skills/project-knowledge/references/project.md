# UniFactory DEX — Project Overview

## What Is This

White-label Uniswap V3 DEX: any team can deploy their own DEX by registering a domain in the BSC Storage contract. Configuration (contracts, tokens, branding) lives on-chain, not in code. The same hosted frontend serves all domains.

**Live demo:** https://appsource.github.io/dex
**Light theme:** add `?theme=light` to URL
**Repo:** https://github.com/noxonsu/unifactory

## Problem It Solves

Creating a branded DEX typically requires forking Uniswap Interface (~300k lines), maintaining a full monorepo, and managing infrastructure. UniFactory reduces this to: deploy V3 contracts → register domain → done.

## Key Features

1. **On-chain config** — contracts, token lists, branding stored in BSC Storage, no server-side config
2. **Auto V3/V2 detection** — if `quoter` address present in Storage → V3 mode (quotes + liquidity); otherwise V2 mode (swap only)
3. **Multi-chain** — any EVM chain can be configured; chains 1, 56, 97 already populated
4. **Light/dark theme** — driven by `?theme=light|dark` URL param, propagated to AppKit modal
5. **Admin panel** — web UI to update contracts and branding on-chain without code changes

## Out of Scope

- Order book or limit orders (AMM only)
- Fiat on/off ramps
- Portfolio tracking or analytics
- Mobile app
