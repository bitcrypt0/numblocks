import { isFibonacci, isPerfectSquare, isPrime } from "@/lib/numberTheory";

/**
 * Client-side mirror of Metadata.sol `_completedSetFor` (contracts/render/
 * Metadata.sol). Same five sets, same membership rules, same priority order
 * (rarest first): Small Primes -> Powers of 2 -> Fibonacci -> Perfect
 * Squares -> Decade. The wallet completes a set when it owns every member;
 * membership is evaluated against `tokensOfOwner` instead of per-id
 * `ownerOf` probes, which yields the identical answer in one RPC call.
 */

export const SMALL_PRIMES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
] as const;

export const POWERS_OF_TWO = Array.from({ length: 14 }, (_, i) => 2 ** i); // 1..8192

export const FIB_SET = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765] as const;

export const PERFECT_SQUARES = Array.from({ length: 99 }, (_, i) => (i + 1) ** 2); // 1..9801

export function decadeOf(id: number): number {
  if (id === 0 || id > 10000) return 0;
  return Math.floor((id - 1) / 10) + 1;
}

export function decadeMembers(decade: number): number[] {
  if (decade === 0 || decade > 1000) return [];
  const base = (decade - 1) * 10;
  return Array.from({ length: 10 }, (_, i) => base + i + 1);
}

const holdsAll = (owned: ReadonlySet<number>, members: readonly number[]) =>
  members.every((m) => owned.has(m));

/**
 * The completed-set label for `tokenId` given the owner's full holdings,
 * or null. Labels match Metadata.sol's emitted strings exactly.
 */
export function completedSetFor(tokenId: number, owned: ReadonlySet<number>): string | null {
  if (tokenId >= 2 && tokenId < 100 && isPrime(tokenId) && holdsAll(owned, SMALL_PRIMES)) {
    return "Small Primes";
  }
  if (tokenId > 0 && tokenId <= 8192 && (tokenId & (tokenId - 1)) === 0 && holdsAll(owned, POWERS_OF_TWO)) {
    return "Powers of 2";
  }
  if (tokenId > 0 && tokenId <= 6765 && isFibonacci(tokenId) && holdsAll(owned, FIB_SET)) {
    return "Fibonacci";
  }
  if (tokenId > 0 && tokenId <= 9801 && isPerfectSquare(tokenId) && holdsAll(owned, PERFECT_SQUARES)) {
    return "Perfect Squares";
  }
  const dec = decadeOf(tokenId);
  if (dec !== 0 && holdsAll(owned, decadeMembers(dec))) {
    return `Decade ${dec}`;
  }
  return null;
}
