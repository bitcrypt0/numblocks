# NumberBlocks frontend (design mockup)

Next.js 14 App Router + Tailwind 3.4 + TypeScript strict. Mock data only —
no wallet wiring, no chain reads. The frontend-dapp agent wires it later.

## Run locally

```bash
cd frontend
pnpm install
pnpm dev        # http://localhost:3000 — zero env vars needed
```

Other commands:

```bash
pnpm build      # production build
pnpm lint       # eslint (next/core-web-vitals) — passes clean
pnpm icons      # regenerate favicon set from public/favicon.svg
npx tsc --noEmit  # typecheck — passes clean
```

Lighthouse accessibility (per route, with the dev server running):

```bash
pnpm dlx lighthouse http://localhost:3000 --only-categories=accessibility
```

## Routes

- `/` — landing; rotating hero blocks, how-it-works, badge legend
- `/mint` — five-phase BlocksSale (all phases paid, D-24)
- `/swap` — buy/sell UB; 0.20% team + 0.80% burn fee breakdown; live release meter
- `/wallet` — owned blocks, sealed/unsealed filter, backing health, seal/transfer
- `/block/[id]` — interactive on-chain art, traits (Theme Color, Transformation Progress), history
- `/explore` — filterable gallery (badge, stage, seal, id range) + id search
- `/about` — collector explainer
- `/admin` — owner dashboard (mock-gated by the "owner mode" toggle)

## Structure

- `lib/art.ts` — TS mirror of the D-23 on-chain renderer (dark #0a0a0a canvas,
  badge row, gradient stages 4+, sealed border, bottom strings)
- `lib/numberTheory.ts` — the eight rarity predicates (Round = id % 1000 == 0)
- `lib/mock/` — mockBlocks / mockSale / mockHook / mockWallet / mockStatus;
  shapes mirror `contracts/interfaces/` including the owner setters
- `components/` — NumberBlock, RarityBadges, TransformationStageBar,
  BackingHealthCard, PhaseProgressBar, ReleaseCapacityMeter, ThemeToggle,
  ActionButton, Modal, Toast, admin/*
- Theme: CSS variables + Tailwind `dark:` class, persisted in
  `localStorage("nb-theme")`, OS-preference default, no-flash init script
  in `app/layout.tsx`

## Copy rules honoured

1,000 UB backs each NB; 1.0% total swap fee (0.20% team on buys + 0.80% UB
burn both sides); no free mint — phase 1 is paid; "Transformation Progress"
(never "Growth"); six stages RAW/SANDED/POLISHED/GLOSSY/MIRROR/PRISM;
Genesis #1–5,000 / Sale #5,001–10,000 / Reborn #10,001+; `Theme Color`
trait rendered as a swatch; badge palette matches
`test/render/output/index.html` exactly. No emoji anywhere.

## Pending (blocked on usage limits, not on code)

- Screenshot set under `docs/screens/` (`<route>_<theme>_<viewport>.png`)
- Lighthouse accessibility scores per route
