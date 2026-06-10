"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark toggle. The no-flash init script in app/layout.tsx sets the
 * `dark` class before paint; this control just flips and persists it.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("nb-theme", next ? "dark" : "light");
    } catch {
      /* private mode */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark ?? false}
      className="pressable flex h-11 w-11 items-center justify-center rounded-block border border-line bg-raised text-ink"
    >
      {dark === null ? (
        <span className="block h-5 w-5 rounded-full border-2 border-line" aria-hidden="true" />
      ) : dark ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M16.5 11.5a6.5 6.5 0 0 1-8-8 6.5 6.5 0 1 0 8 8Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" />
          </g>
        </svg>
      )}
    </button>
  );
}
