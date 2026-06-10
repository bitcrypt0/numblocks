"use client";

import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";

/**
 * Embeds the on-chain SVG decoded from `tokenURI(id)` - the authoritative
 * art. Sanitized with DOMPurify's SVG profile: SMIL animation elements are
 * explicitly allowed (the click-to-bounce uses `begin="bg.click"`), scripts,
 * foreignObject, and event-handler attributes are stripped.
 */

const SMIL_TAGS = ["animate", "animateTransform", "animateMotion", "set", "mpath"];
const SMIL_ATTRS = [
  "attributeName",
  "begin",
  "dur",
  "end",
  "values",
  "keyTimes",
  "keySplines",
  "calcMode",
  "additive",
  "accumulate",
  "repeatCount",
  "repeatDur",
  "restart",
  "from",
  "to",
  "by",
];

export function sanitizeOnchainSVG(svg: string, { animate = true }: { animate?: boolean } = {}): string {
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: SMIL_TAGS,
    ADD_ATTR: SMIL_ATTRS,
    FORBID_TAGS: ["script", "foreignObject", "style"],
    NAMESPACE: "http://www.w3.org/2000/svg",
  });
  if (animate) return clean;
  // prefers-reduced-motion: drop the SMIL nodes entirely.
  const doc = new DOMParser().parseFromString(clean, "image/svg+xml");
  doc.querySelectorAll(SMIL_TAGS.join(",")).forEach((el) => el.remove());
  return new XMLSerializer().serializeToString(doc.documentElement);
}

export interface LiveNumberBlockProps {
  /** Raw on-chain SVG markup (decoded, NOT yet sanitized). */
  svg: string | null;
  /** Placeholder markup (already-safe local render) shown until svg arrives. */
  placeholder?: string;
  label: string;
  mat?: boolean;
  className?: string;
}

export default function LiveNumberBlock({ svg, placeholder, label, mat = true, className = "" }: LiveNumberBlockProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const html = useMemo(() => {
    if (svg) return sanitizeOnchainSVG(svg, { animate: !reducedMotion });
    return placeholder ?? "";
  }, [svg, placeholder, reducedMotion]);

  const art = (
    <div
      role="img"
      aria-label={label}
      aria-busy={!svg}
      className="aspect-square w-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  if (!mat) return <div className={className}>{art}</div>;
  return <div className={`art-mat ${className}`}>{art}</div>;
}
