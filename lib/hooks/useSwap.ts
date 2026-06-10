"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useBytecode, usePublicClient, useReadContracts } from "wagmi";
import { numberBlocksHookAbi, swapHelperAbi, uniBlocksAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES, OFFICIAL_POOL_KEY } from "@/lib/web3/addresses";
import { readSlot0, ubPerEthWad } from "@/lib/web3/pool";
import { useTx } from "@/lib/web3/tx";

const HOOK = MAINNET_ADDRESSES.hook;
const HELPER = MAINNET_ADDRESSES.swapHelper;
const UB = MAINNET_ADDRESSES.uniBlocks;
const WAD = 10n ** 18n;
const BACKING_UNIT = 1_000n * WAD;
const LP_FEE_DENOM = 1_000_000n;
/** minOut slippage tolerance applied to estimates: 1%. */
const SLIPPAGE_BPS = 100n;

export interface BuyQuote {
  ethIn: bigint;
  teamFeeEth: bigint;
  grossUBOut: bigint;
  burnUB: bigint;
  netUB: bigint;
  nbMinted: number;
  minUBOut: bigint;
  exceedsRelease: boolean;
  exceedsMintCap: boolean;
}

export interface SellQuote {
  ubIn: bigint;
  burnUB: bigint;
  swappedUB: bigint;
  ethOut: bigint;
  minEthOut: bigint;
}

/**
 * Live swap surface. Fee rates are read from chain - SwapHelper.FEE_TEAM_BPS
 * (= 20, ETH on buys only) and NumberBlocksHook.FEE_BURN_BPS (= 80, UB burn
 * both sides) over BPS_DENOM - never hardcoded (D-24 q-1). The Uniswap LP
 * fee tier (key.fee = 3000 = 0.30%) is separate and only used for quoting.
 */
export function useSwap() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const tx = useTx();

  const reads = useReadContracts({
    contracts: [
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "releasedUB" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "availableUB" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "cumulativeConsumedUB" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "hookStartTime" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "maxNBMintsPerSwap" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "FEE_BURN_BPS" },
      { address: HOOK, abi: numberBlocksHookAbi, functionName: "BPS_DENOM" },
      { address: HELPER, abi: swapHelperAbi, functionName: "FEE_TEAM_BPS" },
      ...(address
        ? [
            { address: UB, abi: uniBlocksAbi, functionName: "balanceOf", args: [address] },
            { address: UB, abi: uniBlocksAbi, functionName: "allowance", args: [address, HELPER] },
          ]
        : []),
      // eslint-disable-next-line
    ] as any,
    query: { refetchInterval: 12_000 },
  });

  const slot0 = useQuery({
    queryKey: ["officialPoolSlot0"],
    enabled: Boolean(publicClient),
    refetchInterval: 12_000,
    queryFn: () => readSlot0(publicClient!),
  });

  const state = useMemo(() => {
    const r = reads.data;
    if (!r || r.some((x) => x.status === "failure")) return null;
    const v = r.map((x) => x.result as unknown);
    return {
      releasedUB: v[0] as bigint,
      availableUB: v[1] as bigint,
      cumulativeConsumedUB: v[2] as bigint,
      hookStartTime: Number(v[3]),
      maxNBMintsPerSwap: Number(v[4]),
      feeBurnBps: BigInt(v[5] as number | bigint),
      bpsDenom: BigInt(v[6] as number | bigint),
      feeTeamBps: BigInt(v[7] as number | bigint),
      ubBalance: address ? (v[8] as bigint) : 0n,
      allowance: address ? (v[9] as bigint) : 0n,
    };
  }, [reads.data, address]);

  const priceWad = slot0.data?.initialized ? ubPerEthWad(slot0.data.sqrtPriceX96) : null;
  const lpFee = BigInt(OFFICIAL_POOL_KEY.fee);

  function quoteBuy(ethIn: bigint): BuyQuote | null {
    if (!state || priceWad === null || ethIn <= 0n) return null;
    const teamFeeEth = (ethIn * state.feeTeamBps) / state.bpsDenom;
    const swapEth = ethIn - teamFeeEth;
    const afterLpFee = (swapEth * (LP_FEE_DENOM - lpFee)) / LP_FEE_DENOM;
    const grossUBOut = (afterLpFee * priceWad) / WAD;
    const burnUB = (grossUBOut * state.feeBurnBps) / state.bpsDenom;
    const netUB = grossUBOut - burnUB;
    const nbUncapped = Number(netUB / BACKING_UNIT);
    return {
      ethIn,
      teamFeeEth,
      grossUBOut,
      burnUB,
      netUB,
      nbMinted: Math.min(nbUncapped, state.maxNBMintsPerSwap),
      minUBOut: (netUB * (state.bpsDenom - SLIPPAGE_BPS)) / state.bpsDenom,
      exceedsRelease: netUB > state.availableUB,
      exceedsMintCap: nbUncapped > state.maxNBMintsPerSwap,
    };
  }

  function quoteSell(ubIn: bigint): SellQuote | null {
    if (!state || priceWad === null || priceWad === 0n || ubIn <= 0n) return null;
    const burnUB = (ubIn * state.feeBurnBps) / state.bpsDenom;
    const swappedUB = ubIn - burnUB;
    const afterLpFee = (swappedUB * (LP_FEE_DENOM - lpFee)) / LP_FEE_DENOM;
    const ethOut = (afterLpFee * WAD) / priceWad;
    return {
      ubIn,
      burnUB,
      swappedUB,
      ethOut,
      minEthOut: (ethOut * (state.bpsDenom - SLIPPAGE_BPS)) / state.bpsDenom,
    };
  }

  async function buy(ethIn: bigint, minUBOut: bigint) {
    if (!address) return { ok: false };
    const result = await tx.run({
      address: HELPER,
      abi: swapHelperAbi,
      functionName: "buyUB",
      args: [minUBOut],
      value: ethIn,
      account: address,
      label: "Buy UB",
    });
    if (result.ok) void reads.refetch();
    return result;
  }

  async function approve(amount: bigint) {
    if (!address) return { ok: false };
    const result = await tx.run({
      address: UB,
      abi: uniBlocksAbi,
      functionName: "approve",
      args: [HELPER, amount],
      account: address,
      label: "Approve UB",
    });
    if (result.ok) void reads.refetch();
    return result;
  }

  async function sell(ubIn: bigint, minEthOut: bigint) {
    if (!address) return { ok: false };
    const result = await tx.run({
      address: HELPER,
      abi: swapHelperAbi,
      functionName: "sellUB",
      args: [ubIn, minEthOut],
      account: address,
      label: "Sell UB",
    });
    if (result.ok) void reads.refetch();
    return result;
  }

  return {
    isLoading: reads.isLoading || slot0.isLoading,
    isError: reads.isError,
    state,
    poolInitialized: slot0.data?.initialized ?? null,
    priceWad,
    quoteBuy,
    quoteSell,
    buy,
    approve,
    sell,
    tx,
  };
}

/**
 * F-MED-2 (c): EIP-7702 seller detection. Non-empty bytecode on the
 * connected EOA means an installed delegate may revert SwapHelper's bare
 * ETH payout - the swap page must block sells (NOT buys) while this is true.
 */
export function useIsDelegatedAccount() {
  const { address } = useAccount();
  const bytecode = useBytecode({
    address,
    query: { enabled: Boolean(address), refetchInterval: 30_000 },
  });
  return {
    isDelegated: Boolean(bytecode.data && bytecode.data !== "0x"),
    checked: bytecode.isFetched,
  };
}
