"use client";

import dynamic from "next/dynamic";

const MintLive = dynamic(() => import("@/components/mint/MintLive"), {
  ssr: false,
  loading: () => (
    <div className="card mt-8 animate-pulse p-8" role="status" aria-label="Loading">
      <div className="h-6 w-40 rounded bg-sunken" />
      <div className="mt-4 h-24 rounded bg-sunken" />
    </div>
  ),
});

export default function MintPage() {
  return (
    <div className="pt-10">
      <header className="max-w-2xl animate-rise-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Mint
        </h1>
        <p className="mt-3 text-lg text-ink-soft">
          The BlocksSale opens ids #5,001–10,000 across five paid phases of 1,000 blocks each.
          Every mint pair-mints 1,000 UB to your wallet, so the new block is exactly backed the
          moment it exists.
        </p>
      </header>
      <MintLive />
    </div>
  );
}
