"use client";

import ActionButton from "@/components/ActionButton";

/**
 * Root error boundary: catches RPC failures, wallet provider crashes, and
 * render errors, and offers actionable recovery instead of a white screen.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const rpcLike = /fetch|network|timeout|rpc|http/i.test(error.message ?? "");
  return (
    <div className="mx-auto max-w-lg pt-20 text-center">
      <div className="card p-10">
        <h1 className="font-display text-3xl font-extrabold text-ink">Something broke</h1>
        <p className="mt-3 text-ink-soft">
          {rpcLike
            ? "Ethereum could not be reached. The RPC endpoint may be down or rate-limited - retry in a moment, or switch networks in your wallet and back."
            : "An unexpected error interrupted this page. Your funds and blocks are unaffected - the chain is the source of truth."}
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint">ref {error.digest}</p>
        ) : null}
        <div className="mt-6 flex justify-center gap-3">
          <ActionButton onClick={() => reset()}>Try again</ActionButton>
          <ActionButton variant="ghost" onClick={() => window.location.assign("/")}>
            Back home
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
