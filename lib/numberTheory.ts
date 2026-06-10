/**
 * TypeScript mirror of contracts/libs/NumberTheory.sol — the eight
 * number-theory rarity predicates. Pure functions over the token id.
 */

export interface Rarity {
  prime: boolean;
  palindrome: boolean;
  perfectSquare: boolean;
  powerOfTwo: boolean;
  fibonacci: boolean;
  triangular: boolean;
  repdigit: boolean;
  round: boolean;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function isPalindrome(n: number): boolean {
  const s = String(n);
  return s === [...s].reverse().join("");
}

export function isPerfectSquare(n: number): boolean {
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function isFibonacci(n: number): boolean {
  let a = 1;
  let b = 1;
  while (b < n) {
    [a, b] = [b, a + b];
  }
  return b === n || n === 1;
}

export function isTriangular(n: number): boolean {
  const k = Math.floor((Math.sqrt(8 * n + 1) - 1) / 2);
  return (k * (k + 1)) / 2 === n;
}

export function isRepdigit(n: number): boolean {
  const s = String(n);
  return s.length > 1 && [...s].every((c) => c === s[0]);
}

export function isRound(n: number): boolean {
  // Mirrors NumberTheory.classify: r.round = n % 1000 == 0
  return n > 0 && n % 1000 === 0;
}

export function classify(n: number): Rarity {
  return {
    prime: isPrime(n),
    palindrome: isPalindrome(n),
    perfectSquare: isPerfectSquare(n),
    powerOfTwo: isPowerOfTwo(n),
    fibonacci: isFibonacci(n),
    triangular: isTriangular(n),
    repdigit: isRepdigit(n),
    round: isRound(n),
  };
}

export function rarityCount(r: Rarity): number {
  return Object.values(r).filter(Boolean).length;
}

export function digitsOf(n: number): number[] {
  return [...String(n)].map((c) => Number(c));
}
