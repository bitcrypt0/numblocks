"use client";

import { useEffect, useState } from "react";
import { formatUB } from "@/lib/format";

const WAD = 10n ** 18n;
const BACKING_UNIT = 1_000n * WAD;
export const INITIAL_RELEASE_UB = 20n * BACKING_UNIT;
export const PER_MINUTE_RELEASE_UB = 10n * BACKING_UNIT;

export interface ReleaseMeterProps {
  /** hookStartTime (unix seconds); 0 = schedule not anchored yet. */
  hookStartTime: number;
  /** Live chain reads. */
  cumulativeConsumedUB: bigint;
}

/**
 * Live view of the hook's timed release schedule, mirrored locally between
 * RPC refreshes: released = 20,000 UB + 10,000 UB per full minute since
 * hookStartTime (D-6); consumed comes from the chain.
 */
export default function ReleaseCapacityMeter({ hookStartTime, cumulativeConsumedUB }: ReleaseMeterProps) {
  const [now, setNow] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const id = window.setInterval(() => {
      setNow((prev) => {
        const next = Math.floor(Date.now() / 1000);
        if (prev !== null && hookStartTime > 0) {
          const prevMin = Math.floor((prev - hookStartTime) / 60);
          const nextMin = Math.floor((next - hookStartTime) / 60);
          if (nextMin > prevMin) {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 500);
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [hookStartTime]);

  const at = now ?? hookStartTime;
  const started = hookStartTime > 0 && at >= hookStartTime;
  const minutes = started ? BigInt(Math.floor((at - hookStartTime) / 60)) : 0n;
  const released = started ? INITIAL_RELEASE_UB + minutes * PER_MINUTE_RELEASE_UB : 0n;
  const availRaw = released - cumulativeConsumedUB;
  const available = availRaw > 0n ? availRaw : 0n;
  const consumedPct = released > 0n ? Number((cumulativeConsumedUB * 1000n) / released) / 10 : 0;
  const nextTick = started ? 60 - ((at - hookStartTime) % 60) : 0;

  return (
    <section aria-labelledby="release-meter-heading" className="card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="release-meter-heading" className="font-display text-lg font-bold text-ink">
          Release capacity
        </h2>
        {started ? (
          <span className="font-mono text-xs tabular text-ink-faint" aria-label={`Next release in ${nextTick} seconds`}>
            +{formatUB(PER_MINUTE_RELEASE_UB)} in {nextTick}s
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        {started
          ? "The pool releases 20,000 UB at launch and 10,000 UB every minute. Buys draw from this bucket; a buy that exceeds it reverts."
          : "The release schedule has not started yet. Buys are possible once the owner anchors the hook start time."}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(consumedPct)}
        aria-label={`${formatUB(cumulativeConsumedUB)} consumed of ${formatUB(released)} released`}
        className="h-4 overflow-hidden rounded-full bg-sunken"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-move ease-soft"
          style={{ width: `${Math.min(100, consumedPct)}%` }}
        />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Released</dt>
          <dd className={`mt-0.5 font-mono text-sm font-bold tabular text-ink ${pulse ? "animate-tick" : ""}`}>
            {formatUB(released)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Consumed</dt>
          <dd className="mt-0.5 font-mono text-sm font-bold tabular text-ink">{formatUB(cumulativeConsumedUB)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Available</dt>
          <dd className={`mt-0.5 font-mono text-sm font-bold tabular text-positive ${pulse ? "animate-tick" : ""}`}>
            {formatUB(available)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
