"use client";

import dynamic from "next/dynamic";

const SwapLive = dynamic(() => import("@/components/swap/SwapLive"), {
  ssr: false,
  loading: () => (
    <div className="card mt-10 animate-pulse p-8" role="status" aria-label="Loading">
      <div className="h-6 w-40 rounded bg-sunken" />
      <div className="mt-4 h-24 rounded bg-sunken" />
    </div>
  ),
});

export default function SwapPage() {
  return (
    <div className="pt-10">
      <header className="max-w-2xl animate-rise-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Swap</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Mint from the first 5000 NumberBlocks NFT IDs by trading ETH for uniBlocks tokens
          through the official pool. Every full 1,000 UB the swap delivers mints one
          NumberBlock — and each new block also pair-mints another 1,000 freshly issued UB to
          you as its backing, on top of the UB you swapped for.
        </p>
      </header>
      <SwapLive />
    </div>
  );
}
