import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink border-transparent",
  secondary: "bg-accent text-accent-ink border-transparent",
  ghost: "bg-raised text-ink border-line",
  danger: "bg-danger text-white border-transparent",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[10px]",
  md: "h-11 px-5 text-base rounded-block",
  lg: "h-14 px-7 text-lg rounded-block",
};

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** The tactile press button — sits on a hard shadow ledge, depresses on tap. */
export default function ActionButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`pressable inline-flex min-w-11 items-center justify-center gap-2 border font-display font-bold tracking-tight disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:transform-none ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  );
}
