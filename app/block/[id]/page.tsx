"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import ActionButton from "@/components/ActionButton";

const BlockLive = dynamic(() => import("@/components/block/BlockLive"), {
  ssr: false,
  loading: () => (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(320px,560px)_1fr]" role="status" aria-label="Loading">
      <div className="card aspect-square animate-pulse bg-sunken" />
      <div className="animate-pulse">
        <div className="h-10 w-64 rounded bg-sunken" />
        <div className="mt-6 h-32 rounded bg-sunken" />
      </div>
    </div>
  ),
});

export default function BlockDetailPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);
  const valid = Number.isInteger(id) && id >= 1 && id <= 20000;

  if (!valid) {
    return (
      <div className="pt-16 text-center">
        <h1 className="font-display text-3xl font-extrabold text-ink">Block not found</h1>
        <p className="mt-3 text-ink-soft">Token ids run from #1 upward. Try the gallery instead.</p>
        <Link href="/explore" className="mt-6 inline-block">
          <ActionButton variant="ghost">Back to Explore</ActionButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <nav aria-label="Breadcrumb" className="animate-rise-in font-mono text-sm text-ink-soft">
        <Link href="/explore" className="underline-offset-4 hover:underline">
          Explore
        </Link>{" "}
        / <span aria-current="page" className="text-ink">#{id}</span>
      </nav>
      <BlockLive id={id} />
    </div>
  );
}
