"use client";

import dynamic from "next/dynamic";

/**
 * Code-split entry for the header connect chip. The whole wagmi+viem stack
 * loads in this async chunk after first paint, keeping the landing-page
 * sync bundle inside its 200KB-gzip budget.
 */
const Inner = dynamic(() => import("./ConnectIsland"), {
  ssr: false,
  loading: () => (
    <span className="flex min-h-11 items-center rounded-block border border-line bg-raised px-3 py-2 font-mono text-sm text-ink-faint">
      …
    </span>
  ),
});

export default function ConnectButton({
  onAdminStatus,
}: {
  /** Receives true while the connected account is the protocol owner. */
  onAdminStatus?: (isAdmin: boolean) => void;
}) {
  return <Inner onAdminStatus={onAdminStatus} />;
}
