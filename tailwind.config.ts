import type { Config } from "tailwindcss";

/**
 * NumberBlocks design tokens — "toy precision".
 *
 * Every colour is a CSS variable defined in app/globals.css so light and
 * dark themes are each fully designed (not derived). Motion, radius, and
 * shadow come from tokens here; components never invent magic numbers.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        raised: "var(--bg-raised)",
        sunken: "var(--bg-sunken)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        brand: "var(--brand)",
        "brand-ink": "var(--brand-ink)",
        "brand-soft": "var(--brand-soft)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        positive: "var(--positive)",
        "positive-soft": "var(--positive-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        warn: "var(--warn)",
        "warn-soft": "var(--warn-soft)",
        mat: "var(--mat)",
        // The eight rarity badge colours — exact values from
        // test/render/output/index.html. Do not adjust.
        badge: {
          prime: "#e63946",
          palindrome: "#2a9d8f",
          square: "#e9c46a",
          pow2: "#3a7bd5",
          fibonacci: "#f4a261",
          triangular: "#8e44ad",
          repdigit: "#2ecc71",
          round: "#e67e22",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        block: "0.875rem",
        card: "1.25rem",
        plate: "1.75rem",
      },
      boxShadow: {
        press: "0 var(--press-depth) 0 0 var(--press-shadow)",
        "press-sm": "0 2px 0 0 var(--press-shadow)",
        "press-down": "0 1px 0 0 var(--press-shadow)",
        lift: "var(--shadow-lift)",
        mat: "var(--shadow-mat)",
      },
      transitionTimingFunction: {
        pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        tap: "120ms",
        move: "200ms",
        scene: "320ms",
      },
      keyframes: {
        "block-bounce": {
          "0%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-12%)" },
          "70%": { transform: "translateY(0)" },
          "85%": { transform: "translateY(-3%)" },
          "100%": { transform: "translateY(0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        tick: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "block-bounce": "block-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "rise-in": "rise-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "toast-in": "toast-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        tick: "tick 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
