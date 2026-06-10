import { encodeAbiParameters, keccak256, encodePacked, type PublicClient } from "viem";
import { OFFICIAL_POOL_KEY, POOL_MANAGER } from "./addresses";

/**
 * Direct slot0 read from the v4 PoolManager via extsload, mirroring
 * v4-core's StateLibrary (POOLS_SLOT = 6, verified against the pinned
 * @uniswap/v4-core 1.0.2). Avoids depending on any periphery StateView
 * deployment, so the same code works on mainnet and on the local fork.
 */

const EXTSLOAD_ABI = [
  {
    type: "function",
    name: "extsload",
    stateMutability: "view",
    inputs: [{ name: "slot", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

const POOLS_SLOT = 6n;

export function officialPoolId(): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint24" },
        { type: "int24" },
        { type: "address" },
      ],
      [
        OFFICIAL_POOL_KEY.currency0,
        OFFICIAL_POOL_KEY.currency1,
        OFFICIAL_POOL_KEY.fee,
        OFFICIAL_POOL_KEY.tickSpacing,
        OFFICIAL_POOL_KEY.hooks,
      ],
    ),
  );
}

export interface Slot0 {
  sqrtPriceX96: bigint;
  initialized: boolean;
}

export async function readSlot0(client: PublicClient): Promise<Slot0> {
  const stateSlot = keccak256(
    encodePacked(["bytes32", "bytes32"], [officialPoolId(), `0x${POOLS_SLOT.toString(16).padStart(64, "0")}`]),
  );
  const raw = await client.readContract({
    address: POOL_MANAGER,
    abi: EXTSLOAD_ABI,
    functionName: "extsload",
    args: [stateSlot],
  });
  const sqrtPriceX96 = BigInt(raw) & ((1n << 160n) - 1n);
  return { sqrtPriceX96, initialized: sqrtPriceX96 !== 0n };
}

const Q96 = 2n ** 96n;
const WAD = 10n ** 18n;

/**
 * Spot price as UB-wei per ETH-wei, scaled by WAD for precision:
 * price1/0 = (sqrtPriceX96 / 2^96)^2 with currency0 = ETH, currency1 = UB.
 */
export function ubPerEthWad(sqrtPriceX96: bigint): bigint {
  return (((sqrtPriceX96 * sqrtPriceX96) / Q96) * WAD) / Q96;
}
