"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderBlockSVG, STAGE_NAMES } from "@/lib/art";
import type { BlockView } from "@/lib/blockView";

export interface NumberBlockProps {
  block: BlockView;
  /** Adds the framed mat so the dark art sits well on light pages. */
  mat?: boolean;
  className?: string;
  /** Extra wrapper-level bounce on click (CSS, reduced-motion aware). */
  interactive?: boolean;
}

/**
 * Client-side mirror of the on-chain renderer, driven by live token state.
 * Used in grids for speed; /block/[id] swaps in the authoritative
 * tokenURI SVG via LiveNumberBlock. Always #0a0a0a background per D-23
 * regardless of UI theme. Click triggers the canonical staggered block
 * bounce (SMIL); disabled under prefers-reduced-motion.
 */
export default function NumberBlock({ block, mat = true, className = "", interactive = true }: NumberBlockProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const svg = useMemo(
    () =>
      renderBlockSVG({
        tokenId: block.id,
        seed: block.seedHash,
        macroStage: block.macroStage,
        transformationProgress: block.transformationProgress,
        sealed: block.sealed,
        resonanceSeal: block.resonanceSeal,
        animate: interactive && !reducedMotion,
      }),
    [block, interactive, reducedMotion],
  );

  const stage = STAGE_NAMES[block.macroStage - 1];
  const label = `NumberBlock number ${block.id}, ${stage} stage${block.sealed ? ", sealed" : ""}`;

  const art = (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className="aspect-square w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );

  if (!mat) return <div className={className}>{art}</div>;
  return <div className={`art-mat ${className}`}>{art}</div>;
}
