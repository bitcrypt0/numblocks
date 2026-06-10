"use client";

import dynamic from "next/dynamic";

const WalletLive = dynamic(() => import("@/components/wallet/WalletLive"), {
  ssr: false,
  loading: () => (
    <div className="card mt-8 animate-pulse p-8" role="status" aria-label="Loading">
      <div className="h-6 w-40 rounded bg-sunken" />
      <div className="mt-4 h-24 rounded bg-sunken" />
    </div>
  ),
});

export default function WalletPage() {
  return (
    <div className="pt-10">
      <WalletLive />
    </div>
  );
}
