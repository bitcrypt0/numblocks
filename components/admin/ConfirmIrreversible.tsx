"use client";

import { useState } from "react";
import ActionButton from "../ActionButton";
import Modal from "../Modal";

export interface ConfirmIrreversibleProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** The word the owner must type to arm the confirm button. */
  word: string;
  children: React.ReactNode;
}

/**
 * The confirm pattern for irreversible owner actions (freezes, the
 * one-shot seed mint): explains the consequence, requires typing a
 * confirmation word, and uses danger styling throughout.
 */
export default function ConfirmIrreversible({
  open,
  onClose,
  onConfirm,
  title,
  word,
  children,
}: ConfirmIrreversibleProps) {
  const [typed, setTyped] = useState("");
  const armed = typed.trim().toUpperCase() === word.toUpperCase();

  function close() {
    setTyped("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      footer={
        <>
          <ActionButton variant="ghost" onClick={close}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            disabled={!armed}
            onClick={() => {
              setTyped("");
              onConfirm();
            }}
          >
            I understand — do it
          </ActionButton>
        </>
      }
    >
      <div className="rounded-block border-2 border-danger bg-danger-soft p-4 text-sm font-semibold text-danger">
        This action cannot be undone. There is no reset, no second path, and no admin override.
      </div>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
      <label htmlFor={`confirm-${word}`} className="mt-5 block font-display font-bold text-ink">
        Type <span className="font-mono text-danger">{word}</span> to confirm
      </label>
      <input
        id={`confirm-${word}`}
        name="confirmWord"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="mt-2 h-12 w-full rounded-block border-2 border-line bg-raised px-3 font-mono text-ink outline-none focus:border-danger"
      />
    </Modal>
  );
}
