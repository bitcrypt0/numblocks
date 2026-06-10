"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ActionButton from "@/components/ActionButton";
import PhaseProgressBar from "@/components/PhaseProgressBar";
import ConnectGate from "@/components/wallet/ConnectGate";
import Web3Provider from "@/lib/web3/Web3Provider";
import { formatETH, shortAddress } from "@/lib/format";
import { useBlocksSale } from "@/lib/hooks/useBlocksSale";

function MintInner() {
  const { isConnected } = useAccount();
  const { sale, recentMints, paidMint, tx, isLoading, isError } = useBlocksSale();
  const [count, setCount] = useState(1);

  if (isLoading) {
    return (
      <div className="card mt-8 animate-pulse p-8" role="status" aria-label="Loading sale state">
        <div className="h-6 w-40 rounded bg-sunken" />
        <div className="mt-4 h-24 rounded bg-sunken" />
      </div>
    );
  }
  if (isError || !sale) {
    return (
      <p role="alert" className="mt-8 rounded-block bg-danger-soft p-6 text-sm font-semibold text-danger">
        Could not load the sale state from Ethereum. Check your connection and reload.
      </p>
    );
  }

  const phase = sale.currentPhase;
  const price = sale.activePrice;
  const cap = sale.activeWalletCap;
  const maxNow = Math.min(sale.myRemainingAllowance, sale.phaseSupplyRemaining);
  const selected = Math.min(count, Math.max(1, maxNow));
  const total = price * BigInt(selected);
  const busy = tx.busy;

  return (
    <>
      <div className="mt-8 animate-rise-in [animation-delay:80ms]">
        <PhaseProgressBar phases={sale.phases} phaseSupply={sale.phaseSupply} />
        <p className="mt-3 text-sm text-ink-soft">
          The owner sets each phase{"’"}s price and per-wallet cap before it starts. The moment a
          phase sells its first block, its terms lock permanently.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_minmax(280px,380px)]">
        <section aria-labelledby="mint-panel-heading" className="card animate-rise-in p-6 [animation-delay:140ms] sm:p-8">
          {!sale.isOpen ? (
            <div>
              <h2 id="mint-panel-heading" className="font-display text-2xl font-bold text-ink">
                Sale not open yet
              </h2>
              <p className="mt-3 text-ink-soft">
                The five-phase BlocksSale has not been opened by the owner. Once it opens, phase 1
                starts selling ids #5,001 upward.
              </p>
            </div>
          ) : sale.isClosed ? (
            <div>
              <h2 id="mint-panel-heading" className="font-display text-2xl font-bold text-ink">
                Sale closed permanently
              </h2>
              <p className="mt-3 text-ink-soft">
                All five phases sold out. New blocks now mint only through official pool buys -
                head to the Swap page.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="mint-panel-heading" className="font-display text-2xl font-bold text-ink">
                  Phase {phase}
                </h2>
                <span className="rounded-full bg-brand-soft px-3 py-1 font-display text-sm font-bold text-brand">
                  Selling now
                </span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-block bg-sunken p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Price per block</dt>
                  <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">{formatETH(price)}</dd>
                </div>
                <div className="rounded-block bg-sunken p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Remaining</dt>
                  <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">
                    {sale.phaseSupplyRemaining.toLocaleString("en-US")}/{sale.phaseSupply.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="rounded-block bg-sunken p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Your phase mints</dt>
                  <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">
                    {isConnected ? `${sale.myPhaseMints}/${cap}` : `-/${cap}`}
                  </dd>
                </div>
              </dl>

              <ConnectGate title="Connect to mint">
                <fieldset className="mt-8" disabled={busy}>
                  <legend className="font-display font-bold text-ink">How many blocks?</legend>
                  <div className="mt-3 flex flex-wrap gap-2" role="group">
                    {Array.from({ length: cap }, (_, i) => i + 1).map((n) => {
                      const allowed = n <= maxNow;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={!allowed}
                          aria-pressed={selected === n}
                          onClick={() => setCount(n)}
                          className={`pressable chip-digit h-14 w-14 border-2 text-xl ${
                            selected === n
                              ? "border-brand bg-brand text-brand-ink"
                              : "border-line bg-raised text-ink"
                          } disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">
                    Per-wallet cap this phase: {cap}. You can mint {maxNow} more.
                  </p>
                </fieldset>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-xl font-bold tabular text-ink">Total {formatETH(total)}</p>
                  <ActionButton
                    size="lg"
                    disabled={maxNow === 0 || busy}
                    onClick={() => void paidMint(selected)}
                  >
                    {busy
                      ? tx.state.status === "awaiting-signature"
                        ? "Confirm in wallet…"
                        : tx.state.status === "pending"
                          ? "Minting…"
                          : "Working…"
                      : `Mint ${selected} block${selected > 1 ? "s" : ""}`}
                  </ActionButton>
                </div>
                {maxNow === 0 ? (
                  <p className="mt-3 rounded-block bg-warn-soft p-3 text-sm font-semibold text-warn">
                    You have reached this phase{"’"}s per-wallet cap. The next phase resets your allowance.
                  </p>
                ) : null}
              </ConnectGate>

              <p className="mt-4 text-sm text-ink-soft">
                Mints are EOA-only - contract callers and EIP-7702 delegated accounts are rejected.
                Overpayment refunds in the same transaction. Each block arrives with its 1,000 UB
                backing, minted fresh at purchase.
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="recent-mints-heading" className="card animate-rise-in p-6 [animation-delay:200ms]">
          <h2 id="recent-mints-heading" className="font-display text-lg font-bold text-ink">
            Recent mints
          </h2>
          {recentMints.length === 0 ? (
            <p className="mt-4 rounded-block bg-sunken p-4 text-sm text-ink-soft">
              No mints in the recent blocks yet.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {recentMints.map((m) => (
                <li key={m.tokenId} className="flex items-center justify-between gap-3 rounded-block bg-sunken px-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-bold tabular text-ink">#{m.tokenId}</p>
                    <p className="font-mono text-xs text-ink-faint">{shortAddress(m.buyer)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular text-ink-soft">{formatETH(m.ethPaid)}</p>
                    <p className="text-xs text-ink-faint">block {m.blockNumber.toString()}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-sm text-ink-soft">
            When phase 5 sells out the sale closes permanently. From then on, new blocks mint only
            through official pool buys.
          </p>
        </section>
      </div>
    </>
  );
}

export default function MintLive() {
  return (
    <Web3Provider>
      <MintInner />
    </Web3Provider>
  );
}
