"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import ActionButton from "../ActionButton";
import FreezeControl from "./FreezeControl";
import { useToast } from "../Toast";
import type { ProtocolStatus } from "@/lib/hooks/useProtocolStatus";
import { numberBlocksCoreAbi, numberBlocksHookAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

const HOOK = MAINNET_ADDRESSES.hook;
const CORE = MAINNET_ADDRESSES.core;

/**
 * Hook / launch configuration (INumberBlocksHook owner setters) plus the
 * protocol freezes and the skipNFT registry. Setters disable once
 * freezeHookConfig runs; every freeze is an explicit confirm-word action.
 */
export default function HookConfigPanel({
  status,
  onChanged,
}: {
  status: ProtocolStatus;
  onChanged: () => void;
}) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const toast = useToast();
  const tx = useTx();
  const [treasury, setTreasury] = useState<string>(status.teamTreasury);
  const [startTime, setStartTime] = useState(() =>
    status.hookStartTime > 0 ? toLocalInput(status.hookStartTime) : "",
  );
  const [maxMints, setMaxMints] = useState(String(status.maxNBMintsPerSwap));
  const [skipTarget, setSkipTarget] = useState("");
  const [skipFlag, setSkipFlag] = useState(true);

  const frozen = status.hookConfigFrozen;
  const maxMintsNum = Number(maxMints);
  const maxMintsValid = Number.isInteger(maxMintsNum) && maxMintsNum >= 50 && maxMintsNum <= 100;

  async function saveHookConfig() {
    if (!address || !publicClient) return;

    if (treasury.toLowerCase() !== status.teamTreasury.toLowerCase()) {
      // F-MED-2: pre-validate the candidate treasury is a bare EOA. The
      // contract enforces NB_HOOK: TREASURY_HAS_CODE too; checking here
      // catches it before any wallet pop-up.
      const code = await publicClient.getCode({ address: treasury as Address });
      if (code && code !== "0x") {
        toast(
          "That address carries code (smart account or EIP-7702 delegate). The treasury must be a bare EOA or the buy-fee leg can brick once frozen.",
          "danger",
        );
        return;
      }
      const r = await tx.run({
        address: HOOK,
        abi: numberBlocksHookAbi,
        functionName: "setTeamTreasury",
        args: [treasury as Address],
        account: address,
        label: "Set team treasury",
      });
      if (!r.ok) return;
    }

    const startUnix = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0;
    if (startUnix > 0 && startUnix !== status.hookStartTime) {
      const r = await tx.run({
        address: HOOK,
        abi: numberBlocksHookAbi,
        functionName: "setHookStartTime",
        args: [BigInt(startUnix)],
        account: address,
        label: "Set hook start time",
      });
      if (!r.ok) return;
    }

    if (maxMintsValid && maxMintsNum !== status.maxNBMintsPerSwap) {
      const r = await tx.run({
        address: HOOK,
        abi: numberBlocksHookAbi,
        functionName: "setMaxNBMintsPerSwap",
        args: [maxMintsNum],
        account: address,
        label: "Set max NB mints per swap",
      });
      if (!r.ok) return;
    }
    onChanged();
  }

  async function setSkipNFT() {
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(skipTarget)) return;
    const r = await tx.run({
      address: CORE,
      abi: numberBlocksCoreAbi,
      functionName: "setSkipNFT",
      args: [skipTarget as Address, skipFlag],
      account: address,
      label: `${skipFlag ? "Add to" : "Remove from"} skipNFT list`,
    });
    if (r.ok) {
      setSkipTarget("");
      onChanged();
    }
  }

  async function freeze(fn: "freezeHookConfig" | "freezeRenderer" | "freezeMetadata" | "freezeSkipNFT") {
    if (!address) return;
    const onHook = fn === "freezeHookConfig";
    const r = await tx.run({
      address: onHook ? HOOK : CORE,
      abi: onHook ? numberBlocksHookAbi : numberBlocksCoreAbi,
      functionName: fn,
      args: [],
      account: address,
      label: fn,
    });
    if (r.ok) onChanged();
  }

  return (
    <section aria-labelledby="hook-config-heading" className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="hook-config-heading" className="font-display text-2xl font-bold text-ink">
          Hook and launch configuration
        </h2>
        {frozen ? (
          <span className="rounded-full bg-sunken px-3 py-1 font-display text-sm font-bold text-ink-faint">
            Config frozen — read-only
          </span>
        ) : (
          <span className="rounded-full bg-warn-soft px-3 py-1 font-display text-sm font-bold text-warn">
            Hot — freeze before launch completes
          </span>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        These wire the official pool. Every setter below locks permanently when the hook config
        freezes.
      </p>

      <fieldset disabled={frozen || tx.busy} className="mt-5 grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Hook owner setters</legend>
        <div>
          <label htmlFor="hook-treasury" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Team treasury (receives the 0.20% buy fee)
          </label>
          <input
            id="hook-treasury"
            name="teamTreasury"
            autoComplete="off"
            spellCheck={false}
            value={treasury}
            onChange={(e) => setTreasury(e.target.value)}
            className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand disabled:text-ink-faint"
          />
          <p className="mt-1 text-xs text-ink-faint">
            Must be a plain address with no code — checked here AND enforced on-chain, so the fee
            leg can never brick.
          </p>
        </div>
        <div>
          <label htmlFor="hook-start" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Hook start time (anchors the release schedule)
          </label>
          <input
            id="hook-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand disabled:text-ink-faint"
          />
          <p className="mt-1 text-xs text-ink-faint">
            20,000 UB releases at this moment, then 10,000 UB per minute.
          </p>
        </div>
        <div>
          <label htmlFor="hook-max-mints" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Max NB mints per swap (50–100)
          </label>
          <input
            id="hook-max-mints"
            inputMode="numeric"
            value={maxMints}
            onChange={(e) => setMaxMints(e.target.value)}
            aria-invalid={!maxMintsValid}
            className={`mt-1 h-11 w-full rounded-block border-2 bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand disabled:text-ink-faint ${
              maxMintsValid ? "border-line" : "border-danger"
            }`}
          />
          {!maxMintsValid ? (
            <p className="mt-1 text-xs font-semibold text-danger">Must be between 50 and 100.</p>
          ) : null}
        </div>
        <div className="flex items-end">
          <ActionButton
            disabled={frozen || tx.busy || !maxMintsValid || !/^0x[0-9a-fA-F]{40}$/.test(treasury)}
            onClick={() => void saveHookConfig()}
          >
            {tx.busy ? "Working…" : "Save hook config"}
          </ActionButton>
        </div>
      </fieldset>

      <h3 className="mt-8 font-display text-lg font-bold text-ink">skipNFT registry</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Addresses on this list can never hold a NumberBlock (protocol contracts, the LP locker).
        {status.skipNFTFrozen ? " The list is frozen." : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="skip-target" className="block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Address
          </label>
          <input
            id="skip-target"
            autoComplete="off"
            spellCheck={false}
            disabled={status.skipNFTFrozen || tx.busy}
            value={skipTarget}
            onChange={(e) => setSkipTarget(e.target.value)}
            placeholder="0x…"
            className="mt-1 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-sm text-ink outline-none focus:border-brand disabled:text-ink-faint"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={skipFlag}
            disabled={status.skipNFTFrozen || tx.busy}
            onChange={(e) => setSkipFlag(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          On the list
        </label>
        <ActionButton
          variant="ghost"
          disabled={status.skipNFTFrozen || tx.busy || !/^0x[0-9a-fA-F]{40}$/.test(skipTarget)}
          onClick={() => void setSkipNFT()}
        >
          Apply
        </ActionButton>
      </div>

      <h3 className="mt-8 font-display text-lg font-bold text-ink">Freezes</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Each freeze is one-way. The launch runbook executes them in order once everything is
        verified on a fork.
      </p>
      <div className="mt-3 space-y-3">
        <FreezeControl
          label="Hook config"
          description="Locks the pool key, swap helper, treasury, start time, and max mints per swap."
          frozen={status.hookConfigFrozen}
          onFreeze={() => void freeze("freezeHookConfig")}
        />
        <FreezeControl
          label="Renderer pointer"
          description="Locks the on-chain SVG renderer. The art can never be redirected again."
          frozen={status.rendererFrozen}
          onFreeze={() => void freeze("freezeRenderer")}
        />
        <FreezeControl
          label="Metadata pointer"
          description="Locks the tokenURI assembler — traits and JSON shape become permanent."
          frozen={status.metadataFrozen}
          onFreeze={() => void freeze("freezeMetadata")}
        />
        <FreezeControl
          label="skipNFT registry"
          description="Locks the list of protocol addresses that can never hold a NumberBlock."
          frozen={status.skipNFTFrozen}
          onFreeze={() => void freeze("freezeSkipNFT")}
        />
      </div>
    </section>
  );
}

function toLocalInput(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
