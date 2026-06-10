import { BADGE_META } from "@/lib/art";
import type { Rarity } from "@/lib/numberTheory";

export interface RarityBadgesProps {
  rarity: Rarity;
  /** "chips" shows labels; "dots" is the compact swatch row for cards. */
  variant?: "chips" | "dots";
}

/**
 * The eight number-theory badges. Colours are the exact canonical values
 * from test/render/output/index.html.
 */
export default function RarityBadges({ rarity, variant = "chips" }: RarityBadgesProps) {
  const active = BADGE_META.filter((b) => rarity[b.key as keyof Rarity]);
  if (active.length === 0) {
    if (variant === "dots") return null;
    return <p className="text-sm text-ink-faint">No number-theory badges</p>;
  }

  if (variant === "dots") {
    return (
      <ul className="flex flex-wrap items-center gap-1.5" aria-label="Rarity badges">
        {active.map((b) => (
          <li key={b.key}>
            <span
              title={b.label}
              aria-label={b.label}
              role="img"
              className="block h-3.5 w-3.5 rounded-[4px]"
              style={{ backgroundColor: b.color }}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Rarity badges">
      {active.map((b) => (
        <li
          key={b.key}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-raised py-1 pl-1.5 pr-3 font-display text-sm font-semibold text-ink"
        >
          <span
            aria-hidden="true"
            className="block h-4 w-4 rounded-[5px]"
            style={{ backgroundColor: b.color }}
          />
          {b.label}
        </li>
      ))}
    </ul>
  );
}
