import { classify, digitsOf, type Rarity } from "./numberTheory";

/**
 * Client-side mirror of contracts/render/Renderer.sol (D-23 art system).
 * Produces the same visual grammar as the on-chain SVG so the mock looks
 * exactly like production: uniform #0a0a0a background, horizontal badge
 * row up top, digit blocks in the lower half, per-block gradients at
 * Stage 4+, thin gradient sealed border, three bottom labelled strings.
 *
 * Determinism: every colour is a pure function of the seed string, the
 * way the renderer derives colours from seedHash.
 */

export const STAGE_NAMES = ["RAW", "SANDED", "POLISHED", "GLOSSY", "MIRROR", "PRISM"] as const;
export type StageName = (typeof STAGE_NAMES)[number];

export const BADGE_META = [
  { key: "prime", label: "Prime", color: "#e63946", desc: "id has no divisors other than 1 and itself" },
  { key: "palindrome", label: "Palindrome", color: "#2a9d8f", desc: "id reads the same left-to-right and right-to-left" },
  { key: "perfectSquare", label: "Perfect Square", color: "#e9c46a", desc: "id is n times n for some integer n" },
  { key: "powerOfTwo", label: "Power of Two", color: "#3a7bd5", desc: "id is 2 to the k for some k" },
  { key: "fibonacci", label: "Fibonacci", color: "#f4a261", desc: "id appears in the Fibonacci sequence" },
  { key: "triangular", label: "Triangular", color: "#8e44ad", desc: "id is n(n+1)/2 for some integer n" },
  { key: "repdigit", label: "Repdigit", color: "#2ecc71", desc: "every digit of the id is identical" },
  { key: "round", label: "Round", color: "#e67e22", desc: "id is a multiple of a power of ten" },
] as const;

export type BadgeKey = (typeof BADGE_META)[number]["key"];

/* ---------------------------------------------------------------- hash */

function hash32(input: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Seed-derived block colour for digit slot `i` (saturated, mid-luminance). */
export function blockColor(seed: string, i: number): string {
  const rnd = hash32(`${seed}:block:${i}`);
  const h = Math.floor(rnd() * 360);
  const s = 62 + Math.floor(rnd() * 30);
  const l = 42 + Math.floor(rnd() * 16);
  return hslToHex(h, s, l);
}

function darken(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - pct));
  const g = Math.round(((n >> 8) & 255) * (1 - pct));
  const b = Math.round((n & 255) * (1 - pct));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** The seed-derived Theme Color trait (D-23: a trait, not the painted bg). */
export function themeColor(seed: string): string {
  const rnd = hash32(`${seed}:bg`);
  const h = Math.floor(rnd() * 360);
  return hslToHex(h, 48 + Math.floor(rnd() * 30), 30 + Math.floor(rnd() * 25)).toUpperCase();
}

/* ------------------------------------------------------------- badges */

/** Exact copies of Renderer.sol `_badgePrime`.._badgeRound` - fill/stroke
 *  inherit from the host `<g>` like the on-chain markup. */
function badgeGlyph(key: BadgeKey): string {
  switch (key) {
    case "prime":
      return `<circle cx="30" cy="30" r="26" fill="none" stroke-width="3"/><text x="30" y="30" font-size="34" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central" stroke="none">P</text>`;
    case "palindrome":
      return `<path d="M16 14 L4 30 L16 46 M44 14 L56 30 L44 46" fill="none" stroke-width="4"/>`;
    case "perfectSquare":
      return `<rect x="6" y="6" width="48" height="48" fill="none" stroke-width="3"/><line x1="22" y1="6" x2="22" y2="54" stroke-width="2"/><line x1="38" y1="6" x2="38" y2="54" stroke-width="2"/><line x1="6" y1="22" x2="54" y2="22" stroke-width="2"/><line x1="6" y1="38" x2="54" y2="38" stroke-width="2"/>`;
    case "powerOfTwo":
      return `<text x="30" y="30" font-size="28" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central" stroke="none">10</text>`;
    case "fibonacci":
      return `<path d="M50 40 A20 20 0 1 0 30 20 A10 10 0 0 0 30 40 A5 5 0 1 0 35 35" fill="none" stroke-width="3"/>`;
    case "triangular":
      return `<polygon points="30,8 54,52 6,52" fill="none" stroke-width="3"/>`;
    case "repdigit":
      return `<rect x="10" y="14" width="6" height="32" stroke="none"/><rect x="27" y="14" width="6" height="32" stroke="none"/><rect x="44" y="14" width="6" height="32" stroke="none"/>`;
    case "round":
      // Exact copy of Renderer.sol `_badgeRound` - a filled 5-pointed star.
      return `<polygon points="30,4 36,24 56,24 40,36 46,56 30,44 14,56 20,36 4,24 24,24" stroke="none"/>`;
  }
}

/**
 * Standalone badge SVG - the exact glyph the on-chain renderer stamps on
 * the art (same 60x60 geometry, same thematic color), for UI legends.
 * Badges are designed to read on the art's dark background; hosts should
 * place them on a dark chip.
 */
export function badgeSVG(key: BadgeKey): string {
  const meta = BADGE_META.find((b) => b.key === key)!;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" role="img" aria-label="${meta.label} badge"><g fill="${meta.color}" stroke="${meta.color}">${badgeGlyph(key)}</g></svg>`;
}

/* ------------------------------------------------------------ render */

export interface RenderOptions {
  tokenId: number;
  seed: string;
  macroStage: number; // 1..6
  transformationProgress: number; // 1..100
  sealed: boolean;
  resonanceSeal?: string | null;
  /** Omit SMIL click-bounce (honours prefers-reduced-motion). */
  animate?: boolean;
}

export function renderBlockSVG(opts: RenderOptions): string {
  const { tokenId, seed, macroStage, transformationProgress, sealed } = opts;
  const animate = opts.animate ?? true;
  const resonance = opts.resonanceSeal ?? null;
  const rarity: Rarity = classify(tokenId);
  const digits = digitsOf(tokenId);
  const n = digits.length;

  const size = n === 5 ? 160 : 180;
  const gap = 20;
  const rowW = n * size + (n - 1) * gap;
  const x0 = 500 - rowW / 2;
  const yTop = 600 - size / 2;

  const defs: string[] = [];
  const parts: string[] = [];

  parts.push(`<rect id="bg" width="1000" height="1000" fill="#0a0a0a"/>`);

  // Digit blocks, staggered bounce on bg.click (D-23 item 10).
  for (let i = 0; i < n; i++) {
    const color = blockColor(seed, i);
    const x = x0 + i * (size + gap);
    let fill = color;
    if (macroStage >= 4) {
      const gid = `grad_${tokenId}_${i}`;
      defs.push(
        `<linearGradient id="${gid}" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, 0.35)}"/></linearGradient>`,
      );
      fill = `url(#${gid})`;
    }
    const anim = animate
      ? `<animateTransform attributeName="transform" type="translate" additive="sum" begin="bg.click+${(i * 0.1).toFixed(3)}s" dur="0.6s" values="0,0;0,-60;0,0;0,-15;0,0" keyTimes="0;0.4;0.7;0.85;1" fill="remove"/>`
      : "";
    const inner: string[] = [];
    inner.push(`<rect x="${x}" y="${yTop}" width="${size}" height="${size}" fill="${fill}"/>`);
    if (macroStage >= 2) {
      inner.push(
        `<rect x="${x + 8}" y="${yTop + 8}" width="${size - 16}" height="${size - 16}" fill="none" stroke="#0a0a0a" stroke-opacity="0.25" stroke-width="10"/>`,
      );
    }
    if (macroStage >= 3) {
      inner.push(
        `<rect x="${x + 10}" y="${yTop + 10}" width="${Math.round(size * 0.32)}" height="${Math.round(size * 0.32)}" fill="#ffffff" opacity="0.18" rx="6"/>`,
      );
    }
    const cx = x + size / 2;
    const cy = yTop + size / 2;
    const fs = Math.round(size * 0.7);
    if (macroStage >= 6) {
      inner.push(
        `<text x="${cx - 3}" y="${cy}" font-size="${fs}" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#ff4d6d" opacity="0.85">${digits[i]}</text>`,
        `<text x="${cx + 3}" y="${cy}" font-size="${fs}" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#4dd6ff" opacity="0.85">${digits[i]}</text>`,
      );
    }
    inner.push(
      `<text x="${cx}" y="${cy}" font-size="${fs}" font-family="monospace" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="#ffffff" opacity="1">${digits[i]}</text>`,
    );
    if (macroStage >= 5) {
      const rid = `refl_${tokenId}_${i}`;
      defs.push(
        `<linearGradient id="${rid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${darken(color, 0.2)}" stop-opacity="0.35"/><stop offset="1" stop-color="${darken(color, 0.5)}" stop-opacity="0"/></linearGradient>`,
      );
      inner.push(
        `<rect x="${x}" y="${yTop + size + 8}" width="${size}" height="${size / 2}" fill="url(#${rid})"/>`,
      );
    }
    parts.push(`<g>${anim}${inner.join("")}</g>`);
  }

  // Top badge row — horizontal, centred, vertical anchor 72 (canonical).
  const active = BADGE_META.filter((b) => rarity[b.key as keyof Rarity]);
  const bw = 60;
  const bgap = 20;
  const totalBadge = active.length * bw + Math.max(0, active.length - 1) * bgap;
  let bx = 500 - totalBadge / 2;
  for (const b of active) {
    parts.push(`<g transform="translate(${bx},72)" fill="${b.color}" stroke="${b.color}">${badgeGlyph(b.key)}</g>`);
    bx += bw + bgap;
  }

  // Sealed border — thin gradient stroke, 40px inset (D-23 item 8).
  if (sealed) {
    defs.push(
      `<linearGradient id="seal_${tokenId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9c46a"/><stop offset="0.5" stop-color="#c0c0c0"/><stop offset="1" stop-color="#e9c46a"/></linearGradient>`,
    );
    parts.push(
      `<rect x="40" y="40" width="920" height="920" fill="none" stroke="url(#seal_${tokenId})" stroke-width="4"/>`,
    );
  }

  // Bottom labelled strings (D-23 item 9).
  const stageName = STAGE_NAMES[Math.min(5, Math.max(0, macroStage - 1))];
  parts.push(
    `<text x="500" y="838" font-size="20" font-family="monospace" font-weight="700" letter-spacing="2" text-anchor="middle" dominant-baseline="central" fill="#f1faee">#${tokenId}</text>`,
    `<text x="500" y="880" font-size="18" font-family="monospace" font-weight="700" letter-spacing="2" text-anchor="middle" dominant-baseline="central" fill="#8ecae6">${stageName} ${transformationProgress}/100</text>`,
  );
  if (resonance) {
    parts.push(
      `<text x="500" y="922" font-size="16" font-family="monospace" font-weight="700" letter-spacing="2" text-anchor="middle" dominant-baseline="central" fill="#e9c46a">${resonance}</text>`,
    );
  }

  const defsBlock = defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="NumberBlock #${tokenId}, ${stageName} stage${sealed ? ", sealed" : ""}">${defsBlock}${parts.join("")}</svg>`;
}
