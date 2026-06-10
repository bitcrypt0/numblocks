"use client";

import dynamic from "next/dynamic";

const AdminLive = dynamic(() => import("@/components/admin/AdminLive"), {
  ssr: false,
  loading: () => (
    <div className="card mt-8 animate-pulse p-8" role="status" aria-label="Loading">
      <div className="h-6 w-40 rounded bg-sunken" />
      <div className="mt-4 h-24 rounded bg-sunken" />
    </div>
  ),
});

export default function AdminPage() {
  return (
    <div className="pt-10">
      <header className="animate-rise-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Admin</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          The owner control surface: sale terms, royalty, the liquidity seed, hook wiring, and the
          freezes. Available only to the on-chain owner.
        </p>
      </header>
      <AdminLive />
    </div>
  );
}
