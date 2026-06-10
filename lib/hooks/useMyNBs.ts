"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { numberBlocksCoreAbi, uniBlocksAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { completedSetFor } from "@/lib/web3/resonance";

const CORE = MAINNET_ADDRESSES.core;
const UB = MAINNET_ADDRESSES.uniBlocks;
const WAD = 10n ** 18n;
export const BACKING_UNIT = 1_000n * WAD;

export interface OwnedNB {
  id: number;
  macroStage: number;
  transformationProgress: number;
  sealed: boolean;
  birthBlock: number;
  sealedAtBlock: number;
  seedHash: `0x${string}`;
  resonanceSeal: string | null;
}

export interface BackingHealth {
  nbCount: number;
  sealedCount: number;
  requiredUB: bigint;
  ubBalance: bigint;
  looseUB: bigint;
  backedCount: number;
  atRiskCount: number;
}

/** Connected wallet's NBs + UB balance + backing health, straight from Core. */
export function useMyNBs() {
  const { address } = useAccount();

  const base = useReadContracts({
    contracts: address
      ? ([
          { address: CORE, abi: numberBlocksCoreAbi, functionName: "tokensOfOwner", args: [address] },
          { address: CORE, abi: numberBlocksCoreAbi, functionName: "sealedTokensOfOwner", args: [address] },
          { address: UB, abi: uniBlocksAbi, functionName: "balanceOf", args: [address] },
        ] as const)
      : [],
    query: { enabled: Boolean(address), refetchInterval: 12_000 },
  });

  const ids = useMemo(
    () => ((base.data?.[0]?.result as readonly bigint[] | undefined) ?? []).map(Number),
    [base.data],
  );
  const sealedIds = useMemo(
    () => new Set(((base.data?.[1]?.result as readonly bigint[] | undefined) ?? []).map(Number)),
    [base.data],
  );
  const ubBalance = (base.data?.[2]?.result as bigint | undefined) ?? 0n;

  const details = useReadContracts({
    contracts: ids.flatMap((id) => [
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "effectiveTransformation", args: [BigInt(id)] },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "tokenState", args: [BigInt(id)] },
      // eslint-disable-next-line
    ]) as any,
    query: { enabled: ids.length > 0, refetchInterval: 30_000 },
  });

  const blocks = useMemo<OwnedNB[]>(() => {
    if (ids.length === 0) return [];
    const owned = new Set(ids);
    return ids.map((id, i) => {
      const eff = details.data?.[i * 2]?.result as readonly [number, number] | undefined;
      const state = details.data?.[i * 2 + 1]?.result as
        | { birthBlock: bigint; sealedAtBlock: bigint; seedHash: `0x${string}` }
        | undefined;
      return {
        id,
        macroStage: eff ? Number(eff[0]) : 1,
        transformationProgress: eff ? Number(eff[1]) : 1,
        sealed: sealedIds.has(id),
        birthBlock: state ? Number(state.birthBlock) : 0,
        sealedAtBlock: state ? Number(state.sealedAtBlock) : 0,
        seedHash: state?.seedHash ?? "0x0",
        resonanceSeal: completedSetFor(id, owned),
      };
    });
  }, [ids, sealedIds, details.data]);

  const health = useMemo<BackingHealth>(() => {
    const nbCount = ids.length;
    const backedCount = Math.min(nbCount, Number(ubBalance / BACKING_UNIT));
    const looseUB = ubBalance - BigInt(backedCount) * BACKING_UNIT;
    return {
      nbCount,
      sealedCount: sealedIds.size,
      requiredUB: BigInt(nbCount) * BACKING_UNIT,
      ubBalance,
      looseUB: looseUB > 0n ? looseUB : 0n,
      backedCount,
      atRiskCount: Math.max(0, nbCount - backedCount),
    };
  }, [ids, sealedIds, ubBalance]);

  return {
    address,
    isLoading: base.isLoading || (ids.length > 0 && details.isLoading),
    isError: base.isError,
    ids,
    blocks,
    ubBalance,
    health,
    refetch: () => {
      void base.refetch();
      void details.refetch();
    },
  };
}
