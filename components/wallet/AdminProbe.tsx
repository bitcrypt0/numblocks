"use client";

import { useEffect, useMemo } from "react";
import type { Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { blocksSaleAbi, numberBlocksCoreAbi, numberBlocksHookAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";

/**
 * Reports whether the connected injected account is the protocol owner
 * (owner() on Core, BlocksSale, or Hook). Drives the header's Admin nav
 * visibility - hidden by default, shown only for the owner. Renders
 * nothing; /admin itself stays independently gated on-chain.
 */
export default function AdminProbe({ onChange }: { onChange: (isAdmin: boolean) => void }) {
  const { address, status } = useAccount();

  const owners = useReadContracts({
    contracts: [
      { address: MAINNET_ADDRESSES.core, abi: numberBlocksCoreAbi, functionName: "owner" },
      { address: MAINNET_ADDRESSES.blocksSale, abi: blocksSaleAbi, functionName: "owner" },
      { address: MAINNET_ADDRESSES.hook, abi: numberBlocksHookAbi, functionName: "owner" },
    ],
    query: {
      enabled: status === "connected",
      staleTime: 5 * 60_000,
    },
  });

  const isAdmin = useMemo(() => {
    if (status !== "connected" || !address || !owners.data) return false;
    const a = address.toLowerCase();
    return owners.data.some(
      (r) => r.status === "success" && (r.result as Address).toLowerCase() === a,
    );
  }, [status, address, owners.data]);

  useEffect(() => {
    onChange(isAdmin);
  }, [isAdmin, onChange]);

  return null;
}
