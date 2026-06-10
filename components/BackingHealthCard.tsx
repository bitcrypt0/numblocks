import { formatUB } from "@/lib/format";
import type { BackingHealth } from "@/lib/hooks/useMyNBs";

/**
 * Wallet backing summary: 1,000 UB backs each NB. Shows backed count,
 * loose UB, and any unsealed NBs at risk of backing cleanup.
 */
export default function BackingHealthCard({ health }: { health: BackingHealth }) {
  const healthy = health.atRiskCount === 0;
  return (
    <section
      aria-labelledby="backing-health-heading"
      className={`card p-5 ${healthy ? "" : "border-danger"}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="backing-health-heading" className="font-display text-lg font-bold text-ink">
          Backing health
        </h2>
        <span
          className={`rounded-full px-3 py-1 font-display text-sm font-bold ${
            healthy ? "bg-positive-soft text-positive" : "bg-danger-soft text-danger"
          }`}
        >
          {healthy ? "Fully backed" : "Action needed"}
        </span>
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        Every NumberBlock needs 1,000 UB behind it.{" "}
        {healthy
          ? `${health.backedCount} of ${health.nbCount} NBs backed, 0 at risk.`
          : `${health.backedCount} of ${health.nbCount} NBs backed — ${health.atRiskCount} unsealed NB${health.atRiskCount === 1 ? "" : "s"} would be burned by backing cleanup.`}
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">UB balance</dt>
          <dd className="mt-1 font-mono text-base font-bold tabular text-ink">{formatUB(health.ubBalance)}</dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Required</dt>
          <dd className="mt-1 font-mono text-base font-bold tabular text-ink">{formatUB(health.requiredUB)}</dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Loose UB</dt>
          <dd className="mt-1 font-mono text-base font-bold tabular text-ink">{formatUB(health.looseUB)}</dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Sealed NBs</dt>
          <dd className="mt-1 font-mono text-base font-bold tabular text-ink">{health.sealedCount}</dd>
        </div>
      </dl>
    </section>
  );
}
