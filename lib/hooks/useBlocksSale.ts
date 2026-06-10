"use client";

import { useMemo } from "react";
import type { Address } from "viem";
import { parseAbiItem } from "viem";
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { blocksSaleAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { useTx } from "@/lib/web3/tx";

const SALE = MAINNET_ADDRESSES.blocksSale;
const PHASES = [1, 2, 3, 4, 5] as const;

export type PhaseStatus = "sold-out" | "selling" | "upcoming";

export interface PhaseInfo {
  phase: number;
  priceWei: bigint;
  walletCap: number;
  /** D-24 lock-on-start: terms freeze the moment the first block sells. */
  locked: boolean;
  status: PhaseStatus;
  /** Exact for the current phase, PHASE_SUPPLY for past, 0 for upcoming. */
  sold: number;
}

export interface RecentMint {
  tokenId: number;
  buyer: Address;
  phase: number;
  ethPaid: bigint;
  blockNumber: bigint;
}

const MINTED_EVENT = parseAbiItem(
  "event Minted(address indexed buyer, uint8 indexed phase, uint256 indexed tokenId, uint256 ethPaid)",
);

/**
 * Live IBlocksSale surface. D-24: there is no free path - the only mint is
 * `paidMint(count)`, and the active phase's price + per-wallet cap are read
 * from `phasePrice()` / `phaseWalletCap()` storage, never hardcoded.
 */
export function useBlocksSale() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const tx = useTx();

  const contracts = useMemo(
    () => [
      { address: SALE, abi: blocksSaleAbi, functionName: "isOpen" },
      { address: SALE, abi: blocksSaleAbi, functionName: "isClosed" },
      { address: SALE, abi: blocksSaleAbi, functionName: "currentPhase" },
      { address: SALE, abi: blocksSaleAbi, functionName: "phaseSupplyRemaining" },
      { address: SALE, abi: blocksSaleAbi, functionName: "PHASE_SUPPLY" },
      ...PHASES.map((p) => ({ address: SALE, abi: blocksSaleAbi, functionName: "phasePrice", args: [p] })),
      ...PHASES.map((p) => ({ address: SALE, abi: blocksSaleAbi, functionName: "phaseWalletCap", args: [p] })),
      ...(address
        ? PHASES.map((p) => ({
            address: SALE,
            abi: blocksSaleAbi,
            functionName: "paidMintedBy",
            args: [address, p],
          }))
        : []),
    ],
    [address],
  );

  const reads = useReadContracts({
    // eslint-disable-next-line
    contracts: contracts as any,
    query: { refetchInterval: 12_000 },
  });

  const data = useMemo(() => {
    const r = reads.data;
    if (!r || r.some((x) => x.status === "failure")) return null;
    const v = r.map((x) => x.result);
    const isOpen = v[0] as boolean;
    const isClosed = v[1] as boolean;
    const currentPhase = Number(v[2]);
    const remaining = Number(v[3]);
    const phaseSupply = Number(v[4]);
    const prices = v.slice(5, 10) as bigint[];
    const caps = (v.slice(10, 15) as (number | bigint)[]).map(Number);
    const mintedBy = address ? (v.slice(15, 20) as (number | bigint)[]).map(Number) : [0, 0, 0, 0, 0];

    const phases: PhaseInfo[] = PHASES.map((p, i) => {
      let status: PhaseStatus;
      let sold: number;
      if (!isOpen || currentPhase === 0) {
        status = "upcoming";
        sold = 0;
      } else if (p < currentPhase || isClosed) {
        status = "sold-out";
        sold = phaseSupply;
      } else if (p === currentPhase) {
        sold = phaseSupply - remaining;
        status = sold >= phaseSupply ? "sold-out" : "selling";
      } else {
        status = "upcoming";
        sold = 0;
      }
      return { phase: p, priceWei: prices[i]!, walletCap: caps[i]!, locked: sold > 0, status, sold };
    });

    const active = phases[currentPhase - 1];
    const myPhaseMints = currentPhase >= 1 ? mintedBy[currentPhase - 1]! : 0;
    return {
      isOpen,
      isClosed,
      currentPhase,
      phaseSupply,
      phaseSupplyRemaining: remaining,
      phases,
      activePrice: active?.priceWei ?? 0n,
      activeWalletCap: active?.walletCap ?? 0,
      myPhaseMints,
      myRemainingAllowance: Math.max(0, (active?.walletCap ?? 0) - myPhaseMints),
    };
  }, [reads.data, address]);

  const recentMints = useQuery({
    queryKey: ["recentMints"],
    enabled: Boolean(publicClient),
    refetchInterval: 24_000,
    queryFn: async (): Promise<RecentMint[]> => {
      const latest = await publicClient!.getBlockNumber();
      const fromBlock = latest > 5_000n ? latest - 5_000n : 0n;
      const logs = await publicClient!.getLogs({
        address: SALE,
        event: MINTED_EVENT,
        fromBlock,
        toBlock: latest,
      });
      return logs
        .slice(-8)
        .reverse()
        .map((log) => ({
          tokenId: Number(log.args.tokenId),
          buyer: log.args.buyer as Address,
          phase: Number(log.args.phase),
          ethPaid: log.args.ethPaid as bigint,
          blockNumber: log.blockNumber,
        }));
    },
  });

  async function paidMint(count: number) {
    if (!address || !data) return { ok: false };
    const value = data.activePrice * BigInt(count);
    const result = await tx.run({
      address: SALE,
      abi: blocksSaleAbi,
      functionName: "paidMint",
      args: [count],
      value,
      account: address,
      label: `Mint ${count} block${count > 1 ? "s" : ""}`,
    });
    if (result.ok) {
      void reads.refetch();
      void recentMints.refetch();
    }
    return result;
  }

  return {
    isLoading: reads.isLoading,
    isError: reads.isError,
    refetch: reads.refetch,
    sale: data,
    recentMints: recentMints.data ?? [],
    paidMint,
    tx,
  };
}
