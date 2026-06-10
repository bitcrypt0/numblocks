"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import ActionButton from "../ActionButton";
import ConfirmIrreversible from "./ConfirmIrreversible";
import { formatUB, parseEtherish } from "@/lib/format";
import { numberBlocksCoreAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

/**
 * Core.mintSeedLiquidityUB (D-26): the one-shot, owner-only mint of loose
 * UB that funds the pool's initial liquidity. The action panel renders only
 * while `seedMinted()` is false; once true the panel is a terminal
 * read-only state - there is no second mint, ever.
 */
export default function SeedLiquidityPanel({ seeded, onChanged }: { seeded: boolean; onChanged: () => void }) {
  const { address } = useAccount();
  const tx = useTx();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("5000000");
  const [confirming, setConfirming] = useState(false);
  const parsedAmount = parseEtherish(amount);

  async function mintSeed() {
    if (!address || parsedAmount === null) return;
    const r = await tx.run({
      address: MAINNET_ADDRESSES.core,
      abi: numberBlocksCoreAbi,
      functionName: "mintSeedLiquidityUB",
      args: [recipient as Address, parsedAmount],
      account: address,
      label: "Mint seed UB (one-shot)",
    });
    if (r.ok) onChanged();
  }

  return (
    <section aria-labelledby="seed-heading" className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="seed-heading" className="font-display text-2xl font-bold text-ink">
          Liquidity seed
        </h2>
        {seeded ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-positive-soft px-3 py-1 font-display text-sm font-bold text-positive">
            <CheckIcon /> Already seeded — spent forever
          </span>
        ) : (
          <span className="rounded-full bg-warn-soft px-3 py-1 font-display text-sm font-bold text-warn">
            One shot available
          </span>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        The official pool needs starting UB, but every normal mint pairs UB with a block. This
        owner-only mint creates loose, unbacked UB for the initial LP position —{" "}
        <strong className="text-ink">exactly once for the lifetime of the contract</strong>. The
        seeded UB goes into the pool and the LP position is locked away.
      </p>

      {seeded ? (
        <div className="mt-5 rounded-block bg-sunken p-5">
          <p className="font-display font-bold text-ink">The seed mint has been used.</p>
          <p className="mt-1 text-sm text-ink-soft">
            seedMinted() is true. There is no reset and no second mint — this panel is now
            permanently read-only. The seeded float lives in the locked LP position.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="seed-recipient" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
                Recipient
              </label>
              <input
                id="seed-recipient"
                name="seedRecipient"
                autoComplete="off"
                spellCheck={false}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x… (the LP staging wallet)"
                className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand"
              />
            </div>
            <div className="w-44">
              <label htmlFor="seed-amount" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
                Amount (UB)
              </label>
              <input
                id="seed-amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand"
              />
            </div>
            <ActionButton
              variant="danger"
              disabled={!/^0x[0-9a-fA-F]{40}$/.test(recipient) || parsedAmount === null || parsedAmount === 0n || tx.busy}
              onClick={() => setConfirming(true)}
            >
              {tx.busy ? "Working…" : "Mint seed UB — one shot"}
            </ActionButton>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Launch plan default: 5,000,000 UB paired with the staged ETH, then the LP position is
            locked. Run this after Core and UB are wired and before providing liquidity.
          </p>
        </div>
      )}

      <ConfirmIrreversible
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void mintSeed();
        }}
        title="Mint the liquidity seed"
        word="SEED"
      >
        <p>
          You are about to mint{" "}
          <strong className="font-mono text-ink">{parsedAmount !== null ? formatUB(parsedAmount) : "—"}</strong>{" "}
          of loose, unbacked UB to <strong className="font-mono text-ink">{recipient || "—"}</strong>.
        </p>
        <p>
          This is the only time unbacked UB can ever be created. After this call,
          mintSeedLiquidityUB reverts forever with SeedAlreadyMinted.
        </p>
      </ConfirmIrreversible>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8.5 6 12l7.5-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
