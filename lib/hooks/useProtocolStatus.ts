"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { useBalance, useReadContracts } from "wagmi";
import { numberBlocksCoreAbi, numberBlocksHookAbi, blocksSaleAbi, uniBlocksAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";

const { core: CORE, uniBlocks: UB, blocksSale: SALE, hook: HOOK } = MAINNET_ADDRESSES;

export interface ProtocolStatus {
  owners: { core: Address; blocksSale: Address; hook: Address };
  activeSupply: number;
  totalEverMinted: number;
  ubTotalSupply: bigint;
  rendererFrozen: boolean;
  metadataFrozen: boolean;
  skipNFTFrozen: boolean;
  hookConfigFrozen: boolean;
  seedMinted: boolean;
  royaltyReceiver: Address;
  royaltyBps: number;
  teamTreasury: Address;
  hookStartTime: number;
  maxNBMintsPerSwap: number;
  saleBalanceWei: bigint;
}

/** Read-only protocol state for /admin: owners, freezes, supplies, wiring. */
export function useProtocolStatus() {
  const reads = useReadContracts({
    contracts: [
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "owner" },
      { address: SALE, abi: blocksSaleAbi, functionName: "owner" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "owner" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "activeSupply" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "totalEverMinted" },
      { address: UB, abi: uniBlocksAbi, functionName: "totalSupply" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "rendererFrozen" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "metadataFrozen" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "skipNFTFrozen" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "configFrozen" },
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "seedMinted" },
      // royaltyInfo(tokenId, salePrice = 10_000) -> bps == royaltyAmount
      { address: CORE, abi: numberBlocksCoreAbi, functionName: "royaltyInfo", args: [1n, 10_000n] },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "teamTreasury" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "hookStartTime" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "maxNBMintsPerSwap" },
    ],
    query: { refetchInterval: 15_000 },
  });

  const saleBalance = useBalance({ address: SALE, query: { refetchInterval: 15_000 } });

  const status = useMemo<ProtocolStatus | null>(() => {
    const r = reads.data;
    if (!r || r.some((x) => x.status === "failure")) return null;
    const v = r.map((x) => x.result);
    const royalty = v[11] as readonly [Address, bigint];
    return {
      owners: { core: v[0] as Address, blocksSale: v[1] as Address, hook: v[2] as Address },
      activeSupply: Number(v[3]),
      totalEverMinted: Number(v[4]),
      ubTotalSupply: v[5] as bigint,
      rendererFrozen: v[6] as boolean,
      metadataFrozen: v[7] as boolean,
      skipNFTFrozen: v[8] as boolean,
      hookConfigFrozen: v[9] as boolean,
      seedMinted: v[10] as boolean,
      royaltyReceiver: royalty[0],
      royaltyBps: Number(royalty[1]),
      teamTreasury: v[12] as Address,
      hookStartTime: Number(v[13]),
      maxNBMintsPerSwap: Number(v[14]),
      saleBalanceWei: saleBalance.data?.value ?? 0n,
    };
  }, [reads.data, saleBalance.data]);

  return { status, isLoading: reads.isLoading, isError: reads.isError, refetch: reads.refetch };
}
