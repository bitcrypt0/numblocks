"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { numberBlocksCoreAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";

const CORE = MAINNET_ADDRESSES.core;

/** MintPath enum order from INumberBlocksCore. */
const PATH_BLOCKS_SALE = 1;
const PATH_POOL = 2;
const PATH_REBORN = 3;

export interface MintedRanges {
  /** Genesis ids minted so far: 1..genesisMinted. */
  genesisMinted: number;
  /** Sale ids minted so far: 5001..5000+saleMinted. */
  saleMinted: number;
  /** Reborn ids minted so far: 10001..10000+rebornMinted. */
  rebornMinted: number;
  activeSupply: number;
}

/**
 * The collection is enumerable without an indexer because each mint path
 * assigns ids sequentially inside its band; `pathMintCounter(path)` gives
 * the high-water mark per band. Burned ids inside a band surface as
 * `ownerOf` failures and are filtered client-side.
 */
export function useMintedRanges() {
  const reads = useReadContracts({
    contracts: [
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "pathMintCounter", args: [PATH_POOL] },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "pathMintCounter", args: [PATH_BLOCKS_SALE] },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "pathMintCounter", args: [PATH_REBORN] },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "activeSupply" },
    ],
    query: { refetchInterval: 30_000 },
  });

  const ranges = useMemo<MintedRanges | null>(() => {
    const r = reads.data;
    if (!r || r.some((x) => x.status === "failure")) return null;
    return {
      genesisMinted: Number(r[0]!.result),
      saleMinted: Number(r[1]!.result),
      rebornMinted: Number(r[2]!.result),
      activeSupply: Number(r[3]!.result),
    };
  }, [reads.data]);

  return { ranges, isLoading: reads.isLoading, isError: reads.isError };
}

export function allMintedIds(ranges: MintedRanges): number[] {
  return [
    ...Array.from({ length: ranges.genesisMinted }, (_, i) => i + 1),
    ...Array.from({ length: ranges.saleMinted }, (_, i) => 5000 + i + 1),
    ...Array.from({ length: ranges.rebornMinted }, (_, i) => 10_000 + i + 1),
  ];
}

export interface ExploreToken {
  id: number;
  macroStage: number;
  transformationProgress: number;
  sealed: boolean;
  seedHash: `0x${string}`;
  burned: boolean;
}

/** Batched per-token state for a page of ids (allowFailure soaks burned ids). */
export function useTokenPage(ids: number[]) {
  const reads = useReadContracts({
    contracts: ids.flatMap((id) => [
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "effectiveTransformation", args: [BigInt(id)] },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "tokenState", args: [BigInt(id)] },
      // eslint-disable-next-line
    ]) as any,
    allowFailure: true,
    query: { enabled: ids.length > 0, staleTime: 60_000 },
  });

  const tokens = useMemo<ExploreToken[]>(() => {
    if (ids.length === 0 || !reads.data) return [];
    return ids.map((id, i) => {
      const eff = reads.data![i * 2];
      const state = reads.data![i * 2 + 1];
      if (eff?.status !== "success" || state?.status !== "success") {
        return { id, macroStage: 1, transformationProgress: 1, sealed: false, seedHash: "0x0" as const, burned: true };
      }
      const [stage, progress] = eff.result as readonly [number, number];
      const s = state.result as { sealedAtBlock: bigint; seedHash: `0x${string}` };
      return {
        id,
        macroStage: Number(stage),
        transformationProgress: Number(progress),
        sealed: s.sealedAtBlock !== 0n,
        seedHash: s.seedHash,
        burned: false,
      };
    });
  }, [ids, reads.data]);

  return { tokens, isLoading: reads.isLoading };
}
