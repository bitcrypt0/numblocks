"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import ActionButton from "../ActionButton";
import { numberBlocksCoreAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

/** Core.setRoyalty(receiver, basisPoints) - bps capped at MAX_ROYALTY_BPS = 1000. */
export default function RoyaltyPanel({
  receiver,
  bps,
  onChanged,
}: {
  receiver: Address;
  bps: number;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const tx = useTx();
  const [to, setTo] = useState<string>(receiver);
  const [basisPoints, setBasisPoints] = useState(String(bps));
  const parsed = Number(basisPoints);
  const bpsValid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1000;

  async function save() {
    if (!address || !bpsValid) return;
    const r = await tx.run({
      address: MAINNET_ADDRESSES.core,
      abi: numberBlocksCoreAbi,
      functionName: "setRoyalty",
      args: [to as Address, BigInt(parsed)],
      account: address,
      label: "Set royalty",
    });
    if (r.ok) onChanged();
  }

  return (
    <section aria-labelledby="royalty-heading" className="card p-6">
      <h2 id="royalty-heading" className="font-display text-2xl font-bold text-ink">
        Royalty
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        ERC-2981. The receiver may change freely; the rate moves anywhere from 0 to 1,000 basis
        points (10%) — a hard ceiling baked into the contract that cannot be raised.
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="royalty-receiver" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Receiver
          </label>
          <input
            id="royalty-receiver"
            name="royaltyReceiver"
            autoComplete="off"
            spellCheck={false}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand"
          />
        </div>
        <div className="w-40">
          <label htmlFor="royalty-bps" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Basis points (max 1000)
          </label>
          <input
            id="royalty-bps"
            inputMode="numeric"
            value={basisPoints}
            onChange={(e) => setBasisPoints(e.target.value)}
            aria-invalid={!bpsValid}
            aria-describedby="royalty-bps-help"
            className={`mt-1 h-11 w-full rounded-block border-2 bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand ${
              bpsValid ? "border-line" : "border-danger"
            }`}
          />
        </div>
        <ActionButton
          disabled={!bpsValid || !/^0x[0-9a-fA-F]{40}$/.test(to) || tx.busy}
          onClick={() => void save()}
        >
          {tx.busy ? "Working…" : "Save royalty"}
        </ActionButton>
      </div>
      <p id="royalty-bps-help" className={`mt-2 text-sm ${bpsValid ? "text-ink-soft" : "font-semibold text-danger"}`}>
        {bpsValid
          ? `${(parsed / 100).toFixed(2)}% on secondary sales.`
          : "Basis points must be a whole number between 0 and 1000 — the contract reverts above the ceiling."}
      </p>
    </section>
  );
}
