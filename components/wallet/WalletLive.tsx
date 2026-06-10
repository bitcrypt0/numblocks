"use client";

import Link from "next/link";
import { useState } from "react";
import type { Address } from "viem";
import ActionButton from "@/components/ActionButton";
import BackingHealthCard from "@/components/BackingHealthCard";
import Modal from "@/components/Modal";
import NumberBlock from "@/components/NumberBlock";
import RarityBadges from "@/components/RarityBadges";
import ConnectGate from "@/components/wallet/ConnectGate";
import Web3Provider from "@/lib/web3/Web3Provider";
import { STAGE_NAMES } from "@/lib/art";
import { formatUB, shortAddress } from "@/lib/format";
import { classify } from "@/lib/numberTheory";
import { useMyNBs } from "@/lib/hooks/useMyNBs";
import { useSeal, useTransfer, useUnseal } from "@/lib/hooks/useTokenActions";

type Filter = "all" | "sealed" | "unsealed";

function WalletInner() {
  const { address, blocks, ubBalance, health, isLoading, refetch } = useMyNBs();
  const { seal, tx: sealTx } = useSeal();
  const { unseal, tx: unsealTx } = useUnseal();
  const { transfer, tx: transferTx } = useTransfer();
  const [filter, setFilter] = useState<Filter>("all");
  const [transferId, setTransferId] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState("");

  const busy = sealTx.busy || unsealTx.busy || transferTx.busy;
  const visible = blocks.filter((b) =>
    filter === "all" ? true : filter === "sealed" ? b.sealed : !b.sealed,
  );

  async function handleSealToggle(id: number, sealed: boolean) {
    const result = sealed ? await unseal([id]) : await seal([id]);
    if (result.ok) refetch();
  }

  async function handleTransfer() {
    if (transferId === null || !/^0x[0-9a-fA-F]{40}$/.test(transferTo)) return;
    const result = await transfer(transferId, transferTo as Address);
    if (result.ok) {
      setTransferId(null);
      setTransferTo("");
      refetch();
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 animate-rise-in">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Wallet</h1>
          {address ? (
            <p className="mt-2 font-mono text-sm text-ink-soft">{shortAddress(address)}</p>
          ) : null}
        </div>
        {address ? (
          <div className="rounded-block border border-line bg-raised px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">UB balance</p>
            <p className="font-mono text-xl font-bold tabular text-ink">{formatUB(ubBalance)}</p>
            <p className="font-mono text-xs tabular text-ink-faint">{formatUB(health.looseUB)} loose</p>
          </div>
        ) : null}
      </header>

      <div className="mt-8">
        <ConnectGate title="Connect to see your blocks">
          {isLoading ? (
            <div className="card animate-pulse p-8" role="status" aria-label="Loading wallet">
              <div className="h-6 w-40 rounded bg-sunken" />
              <div className="mt-4 h-24 rounded bg-sunken" />
            </div>
          ) : (
            <>
              <div className="animate-rise-in [animation-delay:80ms]">
                <BackingHealthCard health={health} />
              </div>

              <section aria-labelledby="my-blocks-heading" className="mt-10 animate-rise-in [animation-delay:140ms]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 id="my-blocks-heading" className="font-display text-2xl font-bold text-ink">
                    My blocks ({blocks.length})
                  </h2>
                  <div role="group" aria-label="Filter by seal state" className="inline-flex rounded-block border border-line bg-sunken p-1">
                    {(["all", "sealed", "unsealed"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={filter === f}
                        onClick={() => setFilter(f)}
                        className={`h-10 rounded-[10px] px-4 font-display text-sm font-bold capitalize ${
                          filter === f ? "bg-raised text-ink shadow-press-sm" : "text-ink-soft"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((b) => (
                    <li key={b.id} className="card overflow-hidden">
                      <Link href={`/block/${b.id}`} className="block p-3">
                        <NumberBlock
                          block={{
                            id: b.id,
                            seedHash: b.seedHash,
                            macroStage: b.macroStage,
                            transformationProgress: b.transformationProgress,
                            sealed: b.sealed,
                            resonanceSeal: b.resonanceSeal,
                          }}
                        />
                      </Link>
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/block/${b.id}`} className="font-mono text-lg font-bold tabular text-ink underline-offset-4 hover:underline">
                            #{b.id}
                          </Link>
                          <RarityBadges rarity={classify(b.id)} variant="dots" />
                        </div>
                        <p className="mt-1 font-mono text-xs tabular text-ink-soft">
                          {STAGE_NAMES[b.macroStage - 1]} {b.transformationProgress}/100
                          {b.sealed ? " — sealed" : ""}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <ActionButton
                            size="sm"
                            variant={b.sealed ? "ghost" : "secondary"}
                            disabled={busy}
                            onClick={() => void handleSealToggle(b.id, b.sealed)}
                          >
                            {b.sealed ? "Unseal" : "Seal"}
                          </ActionButton>
                          <ActionButton size="sm" variant="ghost" disabled={busy} onClick={() => setTransferId(b.id)}>
                            Transfer
                          </ActionButton>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {visible.length === 0 ? (
                  <p className="mt-6 rounded-block bg-sunken p-6 text-center text-ink-soft">
                    {blocks.length === 0
                      ? "No NumberBlocks in this wallet yet. Mint one, or buy UB through the pool."
                      : `No ${filter} blocks in this wallet.`}
                  </p>
                ) : null}
              </section>
            </>
          )}
        </ConnectGate>
      </div>

      <Modal
        open={transferId !== null}
        onClose={() => setTransferId(null)}
        title={`Transfer #${transferId ?? ""}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setTransferId(null)}>
              Cancel
            </ActionButton>
            <ActionButton
              disabled={!/^0x[0-9a-fA-F]{40}$/.test(transferTo) || transferTx.busy}
              onClick={() => void handleTransfer()}
            >
              {transferTx.busy ? "Transferring…" : "Transfer"}
            </ActionButton>
          </>
        }
      >
        <p className="text-sm">
          Transfers re-check backing on both sides. If your remaining UB cannot cover your other
          blocks, cleanup burns the highest unsealed id.
        </p>
        <label htmlFor="transfer-to" className="mt-4 block font-display font-bold text-ink">
          Recipient address
        </label>
        <input
          id="transfer-to"
          name="recipient"
          autoComplete="off"
          spellCheck={false}
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
          placeholder="0x…"
          className="mt-2 h-12 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand"
        />
      </Modal>
    </>
  );
}

export default function WalletLive() {
  return (
    <Web3Provider>
      <WalletInner />
    </Web3Provider>
  );
}
