"use client";

import Link from "next/link";
import { useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import ActionButton from "@/components/ActionButton";
import LiveNumberBlock from "@/components/LiveNumberBlock";
import Modal from "@/components/Modal";
import RarityBadges from "@/components/RarityBadges";
import TransformationStageBar from "@/components/TransformationStageBar";
import Web3Provider from "@/lib/web3/Web3Provider";
import { renderBlockSVG, STAGE_NAMES } from "@/lib/art";
import { shortAddress } from "@/lib/format";
import { classify } from "@/lib/numberTheory";
import { useNB, useTokenURI } from "@/lib/hooks/useNB";
import { useSeal, useTransfer, useUnseal } from "@/lib/hooks/useTokenActions";

function idRangeLabel(id: number): "Genesis" | "Sale" | "Reborn" {
  return id <= 5000 ? "Genesis" : id <= 10000 ? "Sale" : "Reborn";
}

function BlockInner({ id }: { id: number }) {
  const { address } = useAccount();
  const { nb, isLoading, notFound, refetch } = useNB(id);
  const tokenURI = useTokenURI(id);
  const { seal, tx: sealTx } = useSeal();
  const { unseal, tx: unsealTx } = useUnseal();
  const { transfer, tx: transferTx } = useTransfer();
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTo, setTransferTo] = useState("");

  if (notFound) {
    return (
      <div className="pt-16 text-center">
        <h1 className="font-display text-3xl font-extrabold text-ink">Block not found</h1>
        <p className="mt-3 text-ink-soft">
          #{id} has not been minted (or was burned by backing cleanup). Try the gallery instead.
        </p>
        <Link href="/explore" className="mt-6 inline-block">
          <ActionButton variant="ghost">Back to Explore</ActionButton>
        </Link>
      </div>
    );
  }

  if (isLoading || !nb) {
    return (
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(320px,560px)_1fr]" role="status" aria-label="Loading block">
        <div className="card aspect-square animate-pulse bg-sunken" />
        <div className="animate-pulse">
          <div className="h-10 w-64 rounded bg-sunken" />
          <div className="mt-6 h-32 rounded bg-sunken" />
        </div>
      </div>
    );
  }

  const isOwner = address !== undefined && address.toLowerCase() === nb.owner.toLowerCase();
  const busy = sealTx.busy || unsealTx.busy || transferTx.busy;
  const range = idRangeLabel(nb.id);
  const decoded = tokenURI.data ?? null;
  const themeColor =
    (decoded?.attributes.find((a) => a.trait_type === "Theme Color")?.value as string | undefined) ?? null;
  const resonance =
    (decoded?.attributes.find((a) => a.trait_type === "Resonance Set")?.value as string | undefined) ??
    nb.resonanceSeal ??
    "None";

  const placeholder = renderBlockSVG({
    tokenId: nb.id,
    seed: nb.seedHash,
    macroStage: nb.macroStage,
    transformationProgress: nb.transformationProgress,
    sealed: nb.sealed,
    resonanceSeal: nb.resonanceSeal,
    animate: false,
  });

  const traits: { label: string; value: React.ReactNode }[] = [
    { label: "Token ID", value: <span className="font-mono tabular">#{nb.id}</span> },
    { label: "Range", value: range },
    { label: "Polish Stage", value: STAGE_NAMES[nb.macroStage - 1] },
    {
      label: "Transformation Progress",
      value: (
        <span className="font-mono tabular" aria-live="off">
          {nb.transformationProgress}/100{nb.sealed ? "" : " and counting"}
        </span>
      ),
    },
    { label: "Sealed", value: nb.sealed ? "True" : "False" },
    ...(themeColor
      ? [
          {
            label: "Theme Color",
            value: (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="block h-4 w-4 rounded-[5px] border border-line"
                  style={{ backgroundColor: themeColor }}
                />
                <span className="font-mono">{themeColor}</span>
              </span>
            ),
          },
        ]
      : []),
    { label: "Resonance Set", value: resonance },
    { label: "Owner", value: <span className="font-mono">{shortAddress(nb.owner)}</span> },
  ];

  const history = [
    { what: "Minted", detail: `${range} range`, when: `block ${nb.birthBlock.toLocaleString("en-US")}` },
    ...(nb.sealed
      ? [
          {
            what: "Sealed",
            detail: `at ${STAGE_NAMES[nb.macroStage - 1]} ${nb.transformationProgress}/100`,
            when: `block ${nb.sealedAtBlock.toLocaleString("en-US")}`,
          },
        ]
      : []),
  ];

  async function handleSealToggle() {
    if (!nb) return;
    const result = nb.sealed ? await unseal([nb.id]) : await seal([nb.id]);
    if (result.ok) {
      refetch();
      void tokenURI.refetch();
    }
  }

  async function handleTransfer() {
    if (!nb || !/^0x[0-9a-fA-F]{40}$/.test(transferTo)) return;
    const result = await transfer(nb.id, transferTo as Address);
    if (result.ok) {
      setTransferOpen(false);
      setTransferTo("");
      refetch();
    }
  }

  return (
    <>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(320px,560px)_1fr]">
        <div className="animate-rise-in [animation-delay:60ms]">
          <LiveNumberBlock
            svg={decoded?.svg ?? null}
            placeholder={placeholder}
            label={`NumberBlock number ${nb.id}, ${STAGE_NAMES[nb.macroStage - 1]} stage${nb.sealed ? ", sealed" : ""}`}
            className="w-full"
          />
          <p className="mt-3 text-center text-sm text-ink-faint">
            {decoded
              ? "On-chain art, straight from tokenURI. Tap it to bounce the blocks."
              : "Rendering preview — fetching the on-chain art…"}
          </p>
        </div>

        <div className="animate-rise-in [animation-delay:120ms]">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            NumberBlock <span className="font-mono tabular text-brand">#{nb.id}</span>
          </h1>
          <div className="mt-4">
            <RarityBadges rarity={classify(nb.id)} />
          </div>

          <div className="mt-6">
            <TransformationStageBar
              macroStage={nb.macroStage}
              transformationProgress={nb.transformationProgress}
              sealed={nb.sealed}
            />
            <p className="mt-2 text-sm text-ink-soft">
              {nb.sealed
                ? "Sealed: the transformation is frozen into a specimen card. Unsealing resumes exactly here."
                : "One transformation point every six Ethereum blocks — this counter updates live as blocks land. After PRISM 100/100 the cycle restarts at RAW."}
            </p>
          </div>

          <section aria-labelledby="actions-heading" className="mt-8">
            <h2 id="actions-heading" className="sr-only">
              Actions
            </h2>
            {isOwner ? (
              <div className="flex flex-wrap gap-3">
                <ActionButton variant="secondary" disabled={busy} onClick={() => void handleSealToggle()}>
                  {busy ? "Working…" : nb.sealed ? "Unseal" : "Seal"}
                </ActionButton>
                <ActionButton variant="ghost" disabled={busy} onClick={() => setTransferOpen(true)}>
                  Transfer
                </ActionButton>
              </div>
            ) : (
              <p className="rounded-block bg-sunken p-4 text-sm text-ink-soft">
                Owned by <span className="font-mono">{shortAddress(nb.owner)}</span>. Seal, unseal,
                and transfer are available to the owner.
              </p>
            )}
          </section>

          <section aria-labelledby="traits-heading" className="mt-8">
            <h2 id="traits-heading" className="font-display text-xl font-bold text-ink">
              Traits
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {traits.map((t) => (
                <div key={t.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-sm font-semibold text-ink-faint">{t.label}</dt>
                  <dd className="text-right text-sm font-bold text-ink">{t.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="history-heading" className="mt-8">
            <h2 id="history-heading" className="font-display text-xl font-bold text-ink">
              History
            </h2>
            <ol className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.what} className="flex items-center justify-between gap-4 rounded-block bg-sunken px-4 py-3">
                  <span className="font-display font-bold text-ink">{h.what}</span>
                  <span className="text-sm text-ink-soft">{h.detail}</span>
                  <span className="font-mono text-xs tabular text-ink-faint">{h.when}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={`Transfer #${nb.id}`}
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setTransferOpen(false)}>
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
        <label htmlFor="block-transfer-to" className="mt-4 block font-display font-bold text-ink">
          Recipient address
        </label>
        <input
          id="block-transfer-to"
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

export default function BlockLive({ id }: { id: number }) {
  return (
    <Web3Provider>
      <BlockInner id={id} />
    </Web3Provider>
  );
}
