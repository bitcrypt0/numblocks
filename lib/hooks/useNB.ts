"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBlockNumber, usePublicClient, useReadContracts } from "wagmi";
import { numberBlocksCoreAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { completedSetFor } from "@/lib/web3/resonance";
import type { Address } from "viem";

const CORE = MAINNET_ADDRESSES.core;

export interface NBData {
  id: number;
  owner: Address;
  macroStage: number;
  transformationProgress: number;
  sealed: boolean;
  birthBlock: number;
  sealedAtBlock: number;
  sealedProgressSnapshot: number;
  seedHash: `0x${string}`;
  resonanceSeal: string | null;
}

/**
 * Single-token state for /block/[id], plus the live Polish-stage counter:
 * `effectiveTransformation` is re-read on every new mainnet block (one
 * progress point per 6 blocks, so the visible value ticks ~every 72s).
 */
export function useNB(id: number | null) {
  const enabled = id !== null && Number.isInteger(id) && id >= 1;
  const tokenId = enabled ? BigInt(id!) : 0n;

  // Live block subscription drives the counter refresh.
  const { data: blockNumber } = useBlockNumber({ watch: true, query: { enabled } });

  const reads = useReadContracts({
    contracts: enabled
      ? ([
          { address: CORE, abi: numberBlocksCoreAbi, functionName: "ownerOf", args: [tokenId] },
          { address: CORE, abi: numberBlocksCoreAbi, functionName: "tokenState", args: [tokenId] },
          { address: CORE, abi: numberBlocksCoreAbi, functionName: "effectiveTransformation", args: [tokenId] },
        ] as const)
      : [],
    query: { enabled },
  });

  // Re-read the transformation counter each block.
  const live = useReadContracts({
    contracts: enabled
      ? ([{ address: CORE, abi: numberBlocksCoreAbi, functionName: "effectiveTransformation", args: [tokenId] }] as const)
      : [],
    query: { enabled: enabled && Boolean(blockNumber) },
    blockNumber,
  });

  const ownerAddress = reads.data?.[0]?.result as Address | undefined;

  const ownerTokens = useReadContracts({
    contracts: ownerAddress
      ? ([{ address: CORE, abi: numberBlocksCoreAbi, functionName: "tokensOfOwner", args: [ownerAddress] }] as const)
      : [],
    query: { enabled: Boolean(ownerAddress) },
  });

  const data = useMemo<NBData | null>(() => {
    if (!enabled || !reads.data || reads.data.some((x) => x.status === "failure")) return null;
    const owner = reads.data[0]!.result as Address;
    const state = reads.data[1]!.result as {
      birthBlock: bigint;
      sealedAtBlock: bigint;
      sealedProgressSnapshot: bigint;
      seedHash: `0x${string}`;
    };
    const eff =
      (live.data?.[0]?.result as readonly [number, number] | undefined) ??
      (reads.data[2]!.result as readonly [number, number]);
    const ownedIds = (ownerTokens.data?.[0]?.result as readonly bigint[] | undefined) ?? [];
    const owned = new Set(ownedIds.map(Number));
    return {
      id: id!,
      owner,
      macroStage: Number(eff[0]),
      transformationProgress: Number(eff[1]),
      sealed: state.sealedAtBlock !== 0n,
      birthBlock: Number(state.birthBlock),
      sealedAtBlock: Number(state.sealedAtBlock),
      sealedProgressSnapshot: Number(state.sealedProgressSnapshot),
      seedHash: state.seedHash,
      resonanceSeal: owned.size > 0 ? completedSetFor(id!, owned) : null,
    };
  }, [enabled, id, reads.data, live.data, ownerTokens.data]);

  return {
    isLoading: enabled && reads.isLoading,
    /** True when the token does not exist (or was burned). */
    notFound: enabled && !reads.isLoading && Boolean(reads.data?.[0]?.status === "failure"),
    nb: data,
    blockNumber,
    refetch: () => {
      void reads.refetch();
      void live.refetch();
    },
  };
}

/**
 * tokenURI is the on-chain source of truth for art + traits. Heavy call
 * (full SVG render), so it is fetched once per id and cached; the caller
 * triggers refetch after seal/unseal.
 */
export function useTokenURI(id: number | null) {
  const publicClient = usePublicClient();
  const enabled = id !== null && Number.isInteger(id) && id >= 1 && Boolean(publicClient);

  return useQuery({
    queryKey: ["tokenURI", id],
    enabled,
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      const uri = await publicClient!.readContract({
        address: CORE,
        abi: numberBlocksCoreAbi,
        functionName: "tokenURI",
        args: [BigInt(id!)],
      });
      return decodeTokenURI(uri);
    },
  });
}

export interface DecodedToken {
  name: string;
  description: string;
  /** Raw `<svg>...</svg>` markup decoded from the image data URI. */
  svg: string;
  attributes: { trait_type: string; value: string | number; max_value?: number }[];
}

export function decodeTokenURI(uri: string): DecodedToken {
  const jsonB64 = uri.replace(/^data:application\/json;base64,/, "");
  const json = JSON.parse(atobUniversal(jsonB64));
  const svgB64 = String(json.image ?? "").replace(/^data:image\/svg\+xml;base64,/, "");
  return {
    name: json.name ?? "",
    description: json.description ?? "",
    svg: atobUniversal(svgB64),
    attributes: Array.isArray(json.attributes) ? json.attributes : [],
  };
}

function atobUniversal(b64: string): string {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}
