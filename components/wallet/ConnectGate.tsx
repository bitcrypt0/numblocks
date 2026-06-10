"use client";

import type { ReactNode } from "react";
import { useAccount, useChainId } from "wagmi";
import ConnectControls from "./ConnectControls";
import { CHAIN } from "@/lib/web3/config";

/**
 * Wraps page sections that need a connected mainnet wallet. Renders the
 * children once connected on the right chain; otherwise a clear inline
 * connect / switch-network state (never a dead spinner).
 */
export default function ConnectGate({
  children,
  title = "Connect to continue",
  note,
}: {
  children: ReactNode;
  title?: string;
  note?: string;
}) {
  const { status, chainId } = useAccount();
  const appChainId = useChainId();

  if (status === "connected" && chainId === appChainId) {
    return <>{children}</>;
  }

  if (status === "reconnecting") {
    return (
      <div className="card animate-pulse p-10 text-center" role="status">
        <p className="font-display font-bold text-ink-soft">Restoring wallet connection…</p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <h2 className="font-display text-2xl font-bold text-ink">
        {status === "connected" ? `Switch to ${CHAIN.name}` : title}
      </h2>
      <p className="max-w-md text-ink-soft">
        {status === "connected"
          ? `Your wallet is on the wrong network. NumberBlocks lives on ${CHAIN.name} only.`
          : (note ?? "Connect an installed browser wallet. NumberBlocks is injected-wallet only - no QR codes, no relays.")}
      </p>
      <ConnectControls />
    </div>
  );
}
