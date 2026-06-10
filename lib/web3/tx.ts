"use client";

import { useCallback, useRef, useState } from "react";
import type { Abi, Address, Hash } from "viem";
import { useConfig } from "wagmi";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "wagmi/actions";
import { useToast } from "@/components/Toast";
import { CHAIN, CONFIRMATIONS } from "./config";
import { parseTxError } from "./errors";

/**
 * The transaction state machine every write in the app goes through:
 *
 *   idle -> preparing (simulate) -> awaiting-signature -> pending
 *        -> confirmed -> finalized | failed
 *
 * - `preparing` runs `simulateContract`, so reverts surface as readable
 *   errors BEFORE the wallet pops (and gas is never wasted on a known
 *   revert).
 * - `confirmed` fires on the first inclusion; `finalized` waits for
 *   CONFIRMATIONS (2 on mainnet) so a one-block reorg cannot strand UI
 *   state.
 * - Every failure path funnels through parseTxError (lib/web3/errors.ts).
 */
export type TxStatus =
  | "idle"
  | "preparing"
  | "awaiting-signature"
  | "pending"
  | "confirmed"
  | "finalized"
  | "failed";

export interface TxState {
  status: TxStatus;
  hash?: Hash;
  error?: string;
  /** Raw revert id when one was recovered - used for debugging reports. */
  errorRaw?: string;
}

export interface TxRequest {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  account: Address;
  /** Toast copy, e.g. "Mint 2 blocks". */
  label: string;
  /** Skip simulateContract (only for calls simulation cannot model). */
  skipSimulation?: boolean;
}

const BUSY: TxStatus[] = ["preparing", "awaiting-signature", "pending"];

export function useTx() {
  const config = useConfig();
  const toast = useToast();
  const [state, setState] = useState<TxState>({ status: "idle" });
  const inFlight = useRef(false);

  const reset = useCallback(() => {
    if (!inFlight.current) setState({ status: "idle" });
  }, []);

  const run = useCallback(
    async (req: TxRequest): Promise<{ ok: boolean; hash?: Hash }> => {
      if (inFlight.current) return { ok: false };
      inFlight.current = true;
      setState({ status: "preparing" });
      try {
        const call = {
          address: req.address,
          abi: req.abi,
          functionName: req.functionName,
          args: req.args ?? [],
          value: req.value,
          account: req.account,
          chainId: CHAIN.id,
        };
        if (!req.skipSimulation) {
          // eslint-disable-next-line
          await simulateContract(config, call as any);
        }
        setState({ status: "awaiting-signature" });
        // eslint-disable-next-line
        const hash = await writeContract(config, call as any);
        setState({ status: "pending", hash });
        toast(`${req.label}: submitted.`, "info");

        const receipt = await waitForTransactionReceipt(config, { hash, confirmations: 1 });
        if (receipt.status !== "success") {
          setState({ status: "failed", hash, error: `${req.label} reverted on-chain.` });
          toast(`${req.label} reverted on-chain.`, "danger");
          return { ok: false, hash };
        }
        setState({ status: "confirmed", hash });
        toast(`${req.label}: confirmed.`, "success");

        // Reorg tolerance: the finalized transition (CONFIRMATIONS deep)
        // runs in the background so the UI is usable again at the first
        // inclusion; periodic read refetches self-correct if a reorg drops
        // the tx.
        void waitForTransactionReceipt(config, { hash, confirmations: CONFIRMATIONS })
          .then(() => setState((s) => (s.hash === hash ? { ...s, status: "finalized" } : s)))
          .catch(() => {});
        return { ok: true, hash };
      } catch (error) {
        const parsed = parseTxError(error);
        setState({ status: "failed", error: parsed.message, errorRaw: parsed.raw });
        toast(parsed.message, "danger");
        return { ok: false };
      } finally {
        inFlight.current = false;
      }
    },
    [config, toast],
  );

  return { state, run, reset, busy: BUSY.includes(state.status) };
}
