import type { BlockView } from "./blockView";

/**
 * Deterministic SHOWCASE blocks for the landing page hero and gallery
 * teaser - illustrative art rendered by the client-side mirror of the
 * on-chain renderer. Never used where real token state is displayed; the
 * live pages read the chain.
 */

function seedFor(id: number): `0x${string}` {
  let h = BigInt(id) * 2654435761n + 0x9e3779b97f4a7c15n;
  h ^= h >> 27n;
  h *= 0x3c79ac492ba7b653n;
  h ^= h >> 33n;
  const hex = (h & ((1n << 128n) - 1n)).toString(16).padStart(32, "0");
  return `0x${hex}${hex}`;
}

function det(id: number, salt: number): number {
  let x = (id * 374761393 + salt * 668265263) >>> 0;
  x = (x ^ (x >> 13)) >>> 0;
  x = Math.imul(x, 1274126177) >>> 0;
  return (x >>> 8) / 16777216;
}

export function sampleBlock(id: number): BlockView {
  return {
    id,
    seedHash: seedFor(id),
    macroStage: 1 + Math.floor(det(id, 1) * 6),
    transformationProgress: 1 + Math.floor(det(id, 2) * 100),
    sealed: det(id, 3) < 0.3,
    resonanceSeal: null,
  };
}
