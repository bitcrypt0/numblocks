import Link from "next/link";

/** The NumberBlocks mark: a "1" block and a "0" block, inline SVG so it
 *  inherits no theme dependency — the saturated fills read on both themes. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(8 86 88)">
        <rect x="54" y="61" width="64" height="64" rx="16" fill="#b97308" />
        <rect x="54" y="56" width="64" height="64" rx="16" fill="#f5a623" />
        <text
          x="86"
          y="89"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="44"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#2c1d00"
        >
          0
        </text>
      </g>
      <g transform="rotate(-6 50 54)">
        <rect x="8" y="18" width="84" height="84" rx="20" fill="#1d3f96" />
        <rect x="8" y="12" width="84" height="84" rx="20" fill="#2c5fe0" />
        <text
          x="50"
          y="55"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="58"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
        >
          1
        </text>
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2.5 rounded-block px-1 font-display text-xl font-extrabold tracking-tight text-ink"
    >
      <LogoMark />
      <span>
        Number<span className="text-brand">Blocks</span>
      </span>
    </Link>
  );
}
