"use client";

import type { Address } from "viem";
import { useAccount } from "wagmi";
import { numberBlocksCoreAbi, uniBlocksAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

const CORE = MAINNET_ADDRESSES.core;
const UB = MAINNET_ADDRESSES.uniBlocks;

/** Batch seal: Core.seal(uint256[]) - atomic, owner-only, whole call reverts on any bad id. */
export function useSeal() {
  const { address } = useAccount();
  const tx = useTx();
  async function seal(ids: number[]) {
    if (!address || ids.length === 0) return { ok: false };
    return tx.run({
      address: CORE,
      abi: numberBlocksCoreAbi,
      functionName: "seal",
      args: [ids.map(BigInt)],
      account: address,
      label: ids.length === 1 ? `Seal #${ids[0]}` : `Seal ${ids.length} blocks`,
    });
  }
  return { seal, tx };
}

/** Batch unseal: Core.unseal(uint256[]) - resumes from the saved snapshot. */
export function useUnseal() {
  const { address } = useAccount();
  const tx = useTx();
  async function unseal(ids: number[]) {
    if (!address || ids.length === 0) return { ok: false };
    return tx.run({
      address: CORE,
      abi: numberBlocksCoreAbi,
      functionName: "unseal",
      args: [ids.map(BigInt)],
      account: address,
      label: ids.length === 1 ? `Unseal #${ids[0]}` : `Unseal ${ids.length} blocks`,
    });
  }
  return { unseal, tx };
}

/** Direct NB transfer via safeTransferFrom. */
export function useTransfer() {
  const { address } = useAccount();
  const tx = useTx();
  async function transfer(id: number, to: Address) {
    if (!address) return { ok: false };
    return tx.run({
      address: CORE,
      abi: numberBlocksCoreAbi,
      functionName: "safeTransferFrom",
      args: [address, to, BigInt(id)],
      account: address,
      label: `Transfer #${id}`,
    });
  }
  return { transfer, tx };
}

/** UB ERC20: transfer (balance/allowance reads live in useMyNBs / useSwap). */
export function useUB() {
  const { address } = useAccount();
  const tx = useTx();
  async function transfer(to: Address, amount: bigint) {
    if (!address) return { ok: false };
    return tx.run({
      address: UB,
      abi: uniBlocksAbi,
      functionName: "transfer",
      args: [to, amount],
      account: address,
      label: "Transfer UB",
    });
  }
  return { transfer, tx };
}
