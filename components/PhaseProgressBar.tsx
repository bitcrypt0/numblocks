import { formatETH } from "@/lib/format";
import type { PhaseInfo } from "@/lib/hooks/useBlocksSale";

const STATUS_LABEL: Record<PhaseInfo["status"], string> = {
  "sold-out": "Sold out",
  selling: "Selling now",
  upcoming: "Upcoming",
};

/**
 * The five BlocksSale phases as a row of chunky segments. All phases are
 * paid (D-24); price and per-wallet cap are owner-set per phase (read live
 * from phasePrice/phaseWalletCap) and lock once a phase starts selling.
 */
export default function PhaseProgressBar({ phases, phaseSupply }: { phases: PhaseInfo[]; phaseSupply: number }) {
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5" aria-label="Sale phases">
      {phases.map(({ phase, status, sold, priceWei }) => {
        const pct = phaseSupply > 0 ? Math.round((sold / phaseSupply) * 100) : 0;
        const active = status === "selling";
        return (
          <li
            key={phase}
            aria-current={active ? "step" : undefined}
            className={`rounded-block border-2 p-3 ${
              active
                ? "border-brand bg-brand-soft"
                : status === "sold-out"
                  ? "border-line bg-sunken opacity-80"
                  : "border-line bg-raised"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="chip-digit h-7 w-7 bg-ink text-sm text-bg" aria-hidden="true">
                {phase}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wide ${
                  active ? "text-brand" : status === "sold-out" ? "text-ink-faint" : "text-ink-soft"
                }`}
              >
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mt-2 font-mono text-sm font-bold tabular text-ink">{formatETH(priceWei)}</p>
            <p className="font-mono text-xs tabular text-ink-soft">
              {sold.toLocaleString("en-US")}/{phaseSupply.toLocaleString("en-US")} sold
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
              <div
                className={`h-full rounded-full ${status === "sold-out" ? "bg-ink-faint" : "bg-brand"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
