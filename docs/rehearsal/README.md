# Mainnet-fork rehearsal (frontend-dapp)

Full user journey walked against a local Hardhat fork of Ethereum mainnet at
**FORK_BLOCK_NUMBER 25286800**, using the REAL deployed contract addresses
from `deployments/mainnet/*.json` (Core `0x9C61…4D8d`, UB `0xA027…A4ad`,
BlocksSale `0x738B…9265`, Hook `0xEA99…80cC`, SwapHelper `0xf00d…fC0D`).

At that block the live mainnet rollout was mid-flight (wired through step 09;
pool ALREADY initialized and seed UB ALREADY minted on mainnet). The
remaining launch steps were completed ON THE FORK ONLY by impersonating the
owner EOA via `scripts/frontend-rehearsal-fork.mjs`: LP provision through the
real v4 PositionManager, `openSale()`, `setHookStartTime`. Nothing was
broadcast to mainnet.

## Journey verified (all through the real UI + injected wallet stack)

1. **Connect** - EIP-6963 picker (two providers listed), connect, disconnect,
   reload-reconnect (only when still authorized), fresh reconnect after an
   explicit disconnect. `01-landing-connected.png`
2. **Mint via BlocksSale** - phase 1 live price 0.0003 ETH /cap 3 read from
   `phasePrice()`/`phaseWalletCap()`; minted 2 blocks (#5001, #5002);
   per-wallet counter moved 0/3 -> 2/3, remaining 1,000 -> 998.
   `02-mint-live-phase.png`
3. **Seal** - sealed #5002 from /wallet; sealed split updated.
4. **Buy UB via the v4 pool** - 0.0002 ETH buy; fee panel showed live
   0.20% team / 0.80% burn; hook minted genesis **#1** to the buyer
   (3 NBs total); release meter consumption updated. `03-swap-buy-quote.png`
5. **Sell UB** - approve + sell 1,500 UB two-step; the UI pre-flight
   (mirroring Core.beforeUBSell's exact arithmetic) predicted 2 unsealed
   cleanup burns. `04-swap-sell-preflight.png`
6. **Backing-cleanup count update on /wallet** - after the sell, cleanup
   burned #5001 and #1 (the 2 unsealed), leaving 1 sealed NB backed by
   3,473 UB (2,473 loose) - exactly as predicted. `05-wallet-after-cleanup.png`
7. **Block detail** - authoritative on-chain art straight from `tokenURI`
   (DOMPurify-sanitized, SMIL bounce preserved), `Theme Color` swatch,
   `Transformation Progress` live counter. `06-block-5002-onchain-art.png`
8. **Explore** - collection enumerated from `pathMintCounter` bands; burned
   ids drop out. `07-explore-live-collection.png`
9. **/admin gate** - non-owner wallet gets "Owner only"
   (`08-admin-not-owner-gate.png`); the owner wallet gets the full dashboard
   with phase-1 controls LOCKED ("selling - 2 sold"), seed panel terminal
   ("already seeded"), freezes hot. `09-admin-owner-dashboard.png`

## Re-running it

    # 1. fork node (presents chainId 1 to the mainnet-only frontend)
    HARDHAT_FORK=true FORK_CHAIN_ID=1 FORK_BLOCK_NUMBER=<recent> npx hardhat node --port 8546
    # 2. complete the launch steps on the fork
    node scripts/frontend-rehearsal-fork.mjs
    # 3. frontend/.env.local:
    #    NEXT_PUBLIC_MAINNET_RPC_URL=http://127.0.0.1:8546
    #    MAINNET_RPC_URL=http://127.0.0.1:8546
    #    NEXT_PUBLIC_DEV_INJECTED=1
    pnpm dev
    # 4. screenshots
    node scripts/rehearsal-screenshots.mjs

`NEXT_PUBLIC_DEV_INJECTED=1` loads `public/dev-injected.js`, an
EIP-6963-announcing rehearsal wallet backed by the fork node's unlocked
accounts. It is inert in production (env var unset).
