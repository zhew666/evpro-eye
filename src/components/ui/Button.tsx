import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

const baseClass =
  "inline-flex items-center justify-center gap-1.5 font-bold " +
  "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-primary hover:bg-accent-hover shadow-[var(--shadow-1)] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] " +
    "active:translate-y-px",
  secondary:
    "bg-bg-card text-text border border-[color:var(--color-border-strong)] " +
    "hover:border-accent/50 hover:text-accent",
  ghost:
    "bg-transparent text-text-muted hover:text-text " +
    "hover:bg-[color:var(--color-surface-1)]",
  danger:
    "bg-[color:var(--color-error)]/15 text-[color:var(--color-error)] " +
    "border border-[color:var(--color-error)]/30 " +
    "hover:bg-[color:var(--color-error)]/25",
  link:
    "text-accent hover:underline underline-offset-2 px-0 py-0 !rounded-none",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(baseClass, sizeClasses[size], variantClasses[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
