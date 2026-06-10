"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import ConfirmIrreversible from "./ConfirmIrreversible";

export interface FreezeControlProps {
  label: string;
  /** What the freeze locks, shown in the row and the confirm dialog. */
  description: string;
  frozen: boolean;
  onFreeze: () => void;
}

/** One freeze row: a deliberate, irreversible action with a terminal state. */
export default function FreezeControl({ label, description, frozen, onFreeze }: FreezeControlProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-block border border-line bg-raised p-4">
      <div className="min-w-0">
        <p className="font-display font-bold text-ink">{label}</p>
        <p className="text-sm text-ink-soft">{description}</p>
      </div>
      {frozen ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-sunken px-4 py-2 font-display text-sm font-bold text-ink-faint">
          <LockIcon />
          Frozen — permanent
        </span>
      ) : (
        <ActionButton variant="danger" size="sm" onClick={() => setConfirming(true)}>
          Freeze forever
        </ActionButton>
      )}
      <ConfirmIrreversible
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onFreeze();
        }}
        title={`Freeze: ${label}`}
        word="FREEZE"
      >
        <p>{description}</p>
        <p>
          Once frozen, this surface is immutable for the lifetime of the contract. The only path
          to a different configuration is deploying a new collection.
        </p>
      </ConfirmIrreversible>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="2" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
