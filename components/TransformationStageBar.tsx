import { STAGE_NAMES } from "@/lib/art";

export interface TransformationStageBarProps {
  macroStage: number; // 1..6
  transformationProgress: number; // 1..100
  sealed?: boolean;
}

/**
 * The six-stage transformation cycle (RAW through PRISM), one segment per
 * macro stage, with live progress inside the active segment. The concept
 * is "transformation" — never "growth" (D-24 Part (d)).
 */
export default function TransformationStageBar({
  macroStage,
  transformationProgress,
  sealed = false,
}: TransformationStageBarProps) {
  const pct = Math.min(100, Math.max(0, transformationProgress));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          {STAGE_NAMES[macroStage - 1]}
          {sealed ? <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-ink">Sealed</span> : null}
        </span>
        <span className="font-mono text-sm tabular text-ink-soft">
          {pct}/100
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={600}
        aria-valuenow={(macroStage - 1) * 100 + pct}
        aria-label={`Transformation progress: stage ${macroStage} of 6 (${STAGE_NAMES[macroStage - 1]}), ${pct} of 100`}
        className="flex gap-1"
      >
        {STAGE_NAMES.map((name, i) => {
          const stage = i + 1;
          const fill = stage < macroStage ? 100 : stage === macroStage ? pct : 0;
          return (
            <div key={name} className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken">
              <div
                className={`h-full rounded-full transition-[width] duration-move ease-soft ${sealed ? "bg-accent" : "bg-brand"}`}
                style={{ width: `${fill}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 hidden justify-between sm:flex" aria-hidden="true">
        {STAGE_NAMES.map((name, i) => (
          <span
            key={name}
            className={`flex-1 text-center font-mono text-[10px] uppercase tracking-wider ${
              i + 1 === macroStage ? "font-bold text-ink" : "text-ink-faint"
            }`}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
