"use client";

import dynamic from "next/dynamic";

const ExploreLive = dynamic(() => import("@/components/explore/ExploreLive"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="card aspect-square animate-pulse bg-sunken" />
      ))}
    </div>
  ),
});

export default function ExplorePage() {
  return (
    <div className="pt-10">
      <header className="max-w-2xl animate-rise-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Explore</h1>
        <p className="mt-3 text-lg text-ink-soft">
          The collection, filterable by badge, polish stage, seal state, and id range. Search any
          token id directly.
        </p>
      </header>
      <ExploreLive />
    </div>
  );
}
