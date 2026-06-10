"use client";

import { useAccount } from "wagmi";
import HookConfigPanel from "@/components/admin/HookConfigPanel";
import RoyaltyPanel from "@/components/admin/RoyaltyPanel";
import SaleConfigPanel from "@/components/admin/SaleConfigPanel";
import SeedLiquidityPanel from "@/components/admin/SeedLiquidityPanel";
import StatusPanel from "@/components/admin/StatusPanel";
import ConnectGate from "@/components/wallet/ConnectGate";
import Web3Provider from "@/lib/web3/Web3Provider";
import { shortAddress } from "@/lib/format";
import { useBlocksSale } from "@/lib/hooks/useBlocksSale";
import { useProtocolStatus } from "@/lib/hooks/useProtocolStatus";

/**
 * Owner dashboard, strictly gated on-chain: controls render only when the
 * connected injected account matches `owner()` on Core / BlocksSale / Hook
 * (the deployment uses one owner EOA for all three; the gate still checks
 * each). Everyone else gets the read-only "not the owner" state.
 */
function AdminInner() {
  const { address, status: accountStatus } = useAccount();
  const { status, isLoading, refetch } = useProtocolStatus();
  const sale = useBlocksSale();

  if (isLoading || sale.isLoading || !status || !sale.sale) {
    return (
      <div className="card mt-8 animate-pulse p-8" role="status" aria-label="Loading protocol state">
        <div className="h-6 w-40 rounded bg-sunken" />
        <div className="mt-4 h-24 rounded bg-sunken" />
      </div>
    );
  }

  const connected = accountStatus === "connected" && address !== undefined;
  const a = address?.toLowerCase();
  const isCoreOwner = connected && a === status.owners.core.toLowerCase();
  const isSaleOwner = connected && a === status.owners.blocksSale.toLowerCase();
  const isHookOwner = connected && a === status.owners.hook.toLowerCase();
  const isOwner = isCoreOwner || isSaleOwner || isHookOwner;

  if (!connected) {
    return (
      <div className="mx-auto mt-16 max-w-lg animate-rise-in">
        <ConnectGate title="Connect the owner wallet" note="The dashboard checks the connected account against owner() on-chain." >
          {null}
        </ConnectGate>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto mt-16 max-w-lg animate-rise-in text-center">
        <div className="card p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-sunken" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" className="text-ink-faint" />
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" className="text-ink-faint" />
            </svg>
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-ink">Owner only</h2>
          <p className="mt-3 text-ink-soft">
            This dashboard configures the protocol and is available only to the contract owner.
            The wallet <span className="font-mono">{shortAddress(address!)}</span> does not match
            owner() on Core, BlocksSale, or the hook.
          </p>
        </div>
      </div>
    );
  }

  const refresh = () => {
    void refetch();
    void sale.refetch();
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="animate-rise-in">
        <StatusPanel status={status} currentPhase={sale.sale.currentPhase} />
      </div>
      {isSaleOwner ? (
        <div className="animate-rise-in [animation-delay:60ms]">
          <SaleConfigPanel sale={sale.sale} saleBalanceWei={status.saleBalanceWei} onChanged={refresh} />
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        {isCoreOwner ? (
          <div className="animate-rise-in [animation-delay:120ms]">
            <RoyaltyPanel receiver={status.royaltyReceiver} bps={status.royaltyBps} onChanged={refresh} />
          </div>
        ) : null}
        {isCoreOwner ? (
          <div className="animate-rise-in [animation-delay:160ms]">
            <SeedLiquidityPanel seeded={status.seedMinted} onChanged={refresh} />
          </div>
        ) : null}
      </div>
      {isHookOwner || isCoreOwner ? (
        <div className="animate-rise-in [animation-delay:200ms]">
          <HookConfigPanel status={status} onChanged={refresh} />
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLive() {
  return (
    <Web3Provider>
      <AdminInner />
    </Web3Provider>
  );
}
