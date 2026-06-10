"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import ActionButton from "../ActionButton";
import { useToast } from "../Toast";
import { formatETH, parseEtherish } from "@/lib/format";
import type { useBlocksSale } from "@/lib/hooks/useBlocksSale";
import { blocksSaleAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

const SALE = MAINNET_ADDRESSES.blocksSale;

type SaleData = NonNullable<ReturnType<typeof useBlocksSale>["sale"]>;

/**
 * Owner sale controls (IBlocksSale): setPhasePrice / setPhaseWalletCap per
 * phase - EDITABLE while a phase has not started selling, DISABLED in the
 * UI the moment it has sold its first block, mirroring the on-chain
 * `NB_SALE: PHASE_STARTED` lock so the owner never sends a doomed tx
 * (D-24 lock-on-start). Plus openSale and ETH withdrawal.
 */
export default function SaleConfigPanel({
  sale,
  saleBalanceWei,
  onChanged,
}: {
  sale: SaleData;
  saleBalanceWei: bigint;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const toast = useToast();
  const tx = useTx();
  const [prices, setPrices] = useState<Record<number, string>>(() =>
    Object.fromEntries(sale.phases.map((p) => [p.phase, formatETH(p.priceWei).replace(" ETH", "").replace(/,/g, "")])),
  );
  const [caps, setCaps] = useState<Record<number, string>>(() =>
    Object.fromEntries(sale.phases.map((p) => [p.phase, String(p.walletCap)])),
  );
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");

  async function savePhase(phase: number) {
    if (!address) return;
    const wei = parseEtherish(prices[phase] ?? "");
    const cap = Number(caps[phase]);
    if (wei === null || wei === 0n) {
      toast(`Phase ${phase}: price must be above zero — a zero price would recreate the removed free phase.`, "danger");
      return;
    }
    if (!Number.isInteger(cap) || cap < 1 || cap > sale.phaseSupply) {
      toast(`Phase ${phase}: cap must be between 1 and ${sale.phaseSupply.toLocaleString("en-US")}.`, "danger");
      return;
    }
    const current = sale.phases.find((p) => p.phase === phase)!;
    if (wei !== current.priceWei) {
      const r = await tx.run({
        address: SALE,
        abi: blocksSaleAbi,
        functionName: "setPhasePrice",
        args: [phase, wei],
        account: address,
        label: `Set phase ${phase} price`,
      });
      if (!r.ok) return;
    }
    if (cap !== current.walletCap) {
      const r = await tx.run({
        address: SALE,
        abi: blocksSaleAbi,
        functionName: "setPhaseWalletCap",
        args: [phase, cap],
        account: address,
        label: `Set phase ${phase} wallet cap`,
      });
      if (!r.ok) return;
    }
    onChanged();
  }

  async function openSale() {
    if (!address) return;
    const r = await tx.run({
      address: SALE,
      abi: blocksSaleAbi,
      functionName: "openSale",
      args: [],
      account: address,
      label: "Open the sale",
    });
    if (r.ok) onChanged();
  }

  async function withdraw() {
    if (!address) return;
    const amount = parseEtherish(withdrawAmount);
    if (amount === null || !/^0x[0-9a-fA-F]{40}$/.test(withdrawTo)) return;
    const r = await tx.run({
      address: SALE,
      abi: blocksSaleAbi,
      functionName: "withdraw",
      args: [withdrawTo as Address, amount],
      account: address,
      label: "Withdraw sale ETH",
    });
    if (r.ok) {
      setWithdrawAmount("");
      onChanged();
    }
  }

  return (
    <section aria-labelledby="sale-config-heading" className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sale-config-heading" className="font-display text-2xl font-bold text-ink">
          Sale configuration
        </h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-positive-soft px-3 py-1 font-display text-sm font-bold text-positive">
            {sale.isClosed ? "Closed permanently" : sale.isOpen ? "Sale open" : "Not yet open"}
          </span>
          {!sale.isOpen && !sale.isClosed ? (
            <ActionButton size="sm" disabled={tx.busy} onClick={() => void openSale()}>
              {tx.busy ? "Working…" : "Open the sale"}
            </ActionButton>
          ) : null}
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Each phase{"’"}s price and per-wallet cap stay editable until the phase sells its first
        block; from that moment its terms are locked forever. Controls for started phases are
        disabled here so a doomed transaction is never sent.
      </p>

      <div className="mt-6 space-y-3">
        {sale.phases.map(({ phase, locked, status, sold }) => (
          <fieldset
            key={phase}
            disabled={locked || tx.busy}
            className={`rounded-block border-2 p-4 ${locked ? "border-line bg-sunken" : "border-line bg-raised"}`}
          >
            <legend className="sr-only">{`Phase ${phase} configuration`}</legend>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="chip-digit h-9 w-9 bg-ink text-base text-bg" aria-hidden="true">
                {phase}
              </span>
              <div className="min-w-[10rem] flex-1">
                <label htmlFor={`price-${phase}`} className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Price (ETH)
                </label>
                <input
                  id={`price-${phase}`}
                  inputMode="decimal"
                  value={prices[phase] ?? ""}
                  onChange={(e) => setPrices((s) => ({ ...s, [phase]: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:text-ink-faint"
                />
              </div>
              <div className="w-28">
                <label htmlFor={`cap-${phase}`} className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Wallet cap
                </label>
                <input
                  id={`cap-${phase}`}
                  inputMode="numeric"
                  value={caps[phase] ?? ""}
                  onChange={(e) => setCaps((s) => ({ ...s, [phase]: e.target.value }))}
                  className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:text-ink-faint"
                />
              </div>
              <div className="ml-auto flex items-center gap-3">
                {locked ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 font-display text-sm font-bold text-ink-faint">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" />
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {status === "sold-out" ? "Locked — sold out" : `Locked — selling (${sold.toLocaleString("en-US")} sold)`}
                  </span>
                ) : (
                  <ActionButton size="sm" variant="ghost" onClick={() => void savePhase(phase)}>
                    Save phase {phase}
                  </ActionButton>
                )}
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-8 rounded-block border border-line bg-raised p-4">
        <h3 className="font-display text-lg font-bold text-ink">Withdraw sale ETH</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Accumulated: <span className="font-mono font-bold tabular text-ink">{formatETH(saleBalanceWei)}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="withdraw-to" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Recipient
            </label>
            <input
              id="withdraw-to"
              name="withdrawTo"
              autoComplete="off"
              spellCheck={false}
              value={withdrawTo}
              onChange={(e) => setWithdrawTo(e.target.value)}
              placeholder="0x…"
              className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand"
            />
          </div>
          <div className="w-36">
            <label htmlFor="withdraw-amount" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Amount (ETH)
            </label>
            <input
              id="withdraw-amount"
              inputMode="decimal"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand"
            />
          </div>
          <ActionButton
            disabled={!/^0x[0-9a-fA-F]{40}$/.test(withdrawTo) || parseEtherish(withdrawAmount) === null || tx.busy}
            onClick={() => void withdraw()}
          >
            {tx.busy ? "Working…" : "Withdraw"}
          </ActionButton>
        </div>
      </div>
    </section>
  );
}
