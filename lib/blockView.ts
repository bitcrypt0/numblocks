/**
 * The minimal shape every block-art consumer renders from. Live pages fill
 * it from chain reads (tokenState + effectiveTransformation); the landing
 * page fills it from deterministic sample data (illustrative art only).
 */
export interface BlockView {
  id: number;
  /** Seed driving the deterministic placeholder art (chain seedHash when live). */
  seedHash: string;
  macroStage: number;
  transformationProgress: number;
  sealed: boolean;
  resonanceSeal: string | null;
}
